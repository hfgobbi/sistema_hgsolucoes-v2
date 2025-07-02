const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { sequelize } = require('./config/database');
const consign = require('consign');

// Inicializa o app Express
const app = express();

// Configurações do body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Sincroniza modelos com o banco de dados e inicia o servidor
sequelize.sync({ force: false }).then(() => {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
  });
});
