/**
 * Módulo de logging avançado para o sistema de controle financeiro
 * Centraliza logs, adiciona timestamps e categorização
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Configuração
const LOG_FILE = path.join(process.cwd(), 'app.log');
const ERROR_LOG_FILE = path.join(process.cwd(), 'error.log');

// Níveis de log
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

/**
 * Função principal de logging
 * @param {string} message - Mensagem a ser logada
 * @param {string} level - Nível do log (DEBUG, INFO, WARN, ERROR, CRITICAL)
 * @param {object} metadata - Dados adicionais para incluir no log
 */
function log(message, level = LOG_LEVELS.INFO, metadata = {}) {
  const timestamp = new Date().toISOString();
  
  // Formatar mensagem
  let formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Adicionar metadata se existir
  if (Object.keys(metadata).length > 0) {
    const metadataStr = util.inspect(metadata, { depth: 5, colors: false });
    formattedMessage += `\nMetadata: ${metadataStr}`;
  }
  
  // Escrever no console
  console.log(formattedMessage);
  
  // Escrever no arquivo de log
  fs.appendFileSync(LOG_FILE, formattedMessage + '\n');
  
  // Se for erro, escrever também no arquivo de erros
  if (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.CRITICAL) {
    fs.appendFileSync(ERROR_LOG_FILE, formattedMessage + '\n');
  }
}

// Métodos convenientes para cada nível de log
module.exports = {
  LOG_LEVELS,
  
  debug: (message, metadata) => log(message, LOG_LEVELS.DEBUG, metadata),
  info: (message, metadata) => log(message, LOG_LEVELS.INFO, metadata),
  warn: (message, metadata) => log(message, LOG_LEVELS.WARN, metadata),
  error: (message, metadata) => log(message, LOG_LEVELS.ERROR, metadata),
  critical: (message, metadata) => log(message, LOG_LEVELS.CRITICAL, metadata),
  
  // Método específico para erros com stack trace
  logError: (message, error) => {
    const metadata = {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack
    };
    log(message, LOG_LEVELS.ERROR, metadata);
  }
};
