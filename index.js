const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./config/database');
const consign = require('consign');
const { errorMiddleware } = require('./utils/errorHandler');
const logger = require('./utils/logger');
const { limitarTamanhoRequisicao, adicionarHeadersSeguranca, sanitizarEntrada } = require('./middlewares/securityMiddleware');
const { measureResponseTime, performanceReport } = require('./middlewares/performanceMonitor');
const { initCronJobs } = require('./config/cron-jobs');

// Inicializa o app Express
const app = express();

// Middleware de medição de performance (deve ser o primeiro para medir todo o tempo)
app.use(measureResponseTime);

// Middlewares de segurança
app.use(limitarTamanhoRequisicao);
app.use(adicionarHeadersSeguranca);

// Configurações do body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sanitização de entradas após body-parser
app.use(sanitizarEntrada);

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Carregar módulos com consign
consign()
  .include('models')
  .then('controllers')
  .then('routes')
  .into(app);

// Rota raiz que serve o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Rota admin para relatório de performance
app.get('/admin/performance', (req, res, next) => {
  // Aqui poderia ter uma validação de admin
  performanceReport(req, res, next);
});

// Middleware para lidar com rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ 
    error: { 
      message: `Rota não encontrada: ${req.method} ${req.url}`,
      statusCode: 404
    } 
  });
});

// Middleware de tratamento de erros centralizado
app.use(errorMiddleware);

// Sincroniza modelos com o banco de dados e inicia o servidor
sequelize.sync({ force: false }).then(() => {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    logger.info(`Servidor rodando na porta ${PORT}`);
    logger.info(`Acesse: http://localhost:${PORT}`);
    
    // Inicializar jobs cron
    try {
      initCronJobs();
      logger.info('Jobs cron inicializados com sucesso');
    } catch (error) {
      logger.error('Erro ao inicializar jobs cron:', { error: error.message });
    }
    
    logger.info(`Sistema Controle Financeiro v2.1.0 iniciado com sucesso`);
  });
}).catch(error => {
  logger.critical(`Erro ao sincronizar banco de dados: ${error.message}`, { stack: error.stack });
  process.exit(1);
});
