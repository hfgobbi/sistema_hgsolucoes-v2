/**
 * Script para atualização automática do status de pagamentos vencidos
 * Atualiza o status de movimentações com vencimento expirado para "vencido"
 */

const { Sequelize, Op } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

// Configurações do banco de dados
const dbConfig = require('../config/database');

// Conexão com o banco de dados
const sequelize = new Sequelize(
  dbConfig.database || 'financeiro',
  dbConfig.username || 'postgres',
  dbConfig.password || 'postgres',
  {
    host: dbConfig.host || 'localhost',
    dialect: 'postgres',
    logging: false
  }
);

// Carregar modelos
const Movimentacao = require('../models/Movimentacao')(sequelize, Sequelize.DataTypes);

/**
 * Função principal para atualizar status de pagamentos vencidos
 */
async function atualizarStatusVencidos() {
  try {
    logger.info('Iniciando atualização de status de pagamentos vencidos');
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida');
    
    // Data atual formatada (YYYY-MM-DD)
    const hoje = new Date().toISOString().split('T')[0];
    
    // Buscar movimentações vencidas (data_vencimento < hoje e status_pagamento = 'pendente')
    const movimentacoesVencidas = await Movimentacao.findAll({
      where: {
        data_vencimento: {
          [Op.lt]: hoje
        },
        status_pagamento: 'pendente'
      }
    });
    
    logger.info(`Encontradas ${movimentacoesVencidas.length} movimentações vencidas para atualizar`);
    
    // Atualizar status para "vencido"
    const promises = movimentacoesVencidas.map(async (mov) => {
      mov.status_pagamento = 'vencido';
      await mov.save();
      
      logger.debug(`Movimentação ID ${mov.id} atualizada para "vencido"`);
      return mov;
    });
    
    // Aguardar todas as atualizações
    await Promise.all(promises);
    
    logger.info(`${movimentacoesVencidas.length} movimentações atualizadas para status "vencido"`);
    
  } catch (error) {
    logger.error(`Erro ao atualizar status de pagamentos vencidos: ${error.message}`, {
      stack: error.stack
    });
    process.exit(1);
  } finally {
    // Fechar conexão com o banco de dados
    await sequelize.close();
  }
}

// Executar a função principal
atualizarStatusVencidos()
  .then(() => {
    logger.info('Processo de atualização de status concluído com sucesso');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Erro fatal:', { error: error.message, stack: error.stack });
    console.error('Erro fatal:', error);
    process.exit(1);
  });
