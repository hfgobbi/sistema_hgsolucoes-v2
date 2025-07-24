/**
 * Configuração de jobs cron para execução automática de tarefas
 */

const { exec } = require('child_process');
const path = require('path');
const cron = require('node-cron');
const logger = require('../utils/logger');

// Caminho base para os scripts
const basePath = path.resolve(__dirname, '..');

/**
 * Inicializar jobs cron
 */
function initCronJobs() {
  logger.info('Inicializando jobs cron...');

  // Atualização diária de status de pagamentos vencidos - executa às 00:01
  cron.schedule('1 0 * * *', () => {
    const scriptPath = path.join(basePath, 'scripts', 'update_vencimentos.js');
    logger.info(`Executando script de atualização de status: ${scriptPath}`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Erro ao executar script de atualização de status: ${error.message}`);
        return;
      }
      
      if (stderr) {
        logger.error(`Erro no script: ${stderr}`);
        return;
      }
      
      logger.info(`Script de atualização executado com sucesso: ${stdout}`);
    });
  });

  // Verificação de vencimentos próximos - executa todos os dias às 08:00
  cron.schedule('0 8 * * *', () => {
    const scriptPath = path.join(basePath, 'scripts', 'check_vencimentos.js');
    logger.info(`Executando script de verificação de vencimentos: ${scriptPath}`);
    
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Erro ao executar script de verificação: ${error.message}`);
        return;
      }
      
      if (stderr) {
        logger.error(`Erro no script: ${stderr}`);
        return;
      }
      
      logger.info(`Script de verificação executado com sucesso: ${stdout}`);
    });
  });

  logger.info('Jobs cron inicializados com sucesso');
}

module.exports = {
  initCronJobs
};
