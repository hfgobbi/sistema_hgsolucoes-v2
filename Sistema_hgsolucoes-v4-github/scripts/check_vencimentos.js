/**
 * Script para verificação de vencimentos próximos
 * Verifica movimentações que vencem em breve e envia alertas
 */

const { Sequelize, Op } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

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
const Usuario = require('../models/Usuario')(sequelize, Sequelize.DataTypes);

// Número de dias para considerar como "próximo do vencimento"
const DIAS_ALERTA = process.env.DIAS_ALERTA || 3;

/**
 * Função principal
 */
async function verificarVencimentos() {
  try {
    logger.info(`Iniciando verificação de vencimentos próximos (${DIAS_ALERTA} dias)`);
    
    // Conectar ao banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida');
    
    // Calcular datas
    const hoje = new Date();
    const dataLimite = new Date(hoje);
    dataLimite.setDate(hoje.getDate() + parseInt(DIAS_ALERTA));
    
    // Formatar para comparação SQL (YYYY-MM-DD)
    const hojeFormatado = hoje.toISOString().split('T')[0];
    const dataLimiteFormatada = dataLimite.toISOString().split('T')[0];
    
    // Buscar todos os usuários
    const usuarios = await Usuario.findAll();
    logger.info(`Encontrados ${usuarios.length} usuários para verificar vencimentos`);
    
    let totalNotificacoes = 0;
    
    // Para cada usuário
    for (const usuario of usuarios) {
      // Buscar movimentações com vencimento próximo
      const vencimentos = await Movimentacao.findAll({
        where: {
          usuario_id: usuario.id,
          tipo: 'despesa',
          status_pagamento: {
            [Op.notIn]: ['pago', 'cancelado']
          },
          data_vencimento: {
            [Op.between]: [hojeFormatado, dataLimiteFormatada]
          }
        },
        order: [['data_vencimento', 'ASC']]
      });
      
      if (vencimentos.length > 0) {
        logger.info(`Encontrados ${vencimentos.length} vencimentos próximos para ${usuario.nome} (ID: ${usuario.id})`);
        
        // Se o usuário tem email configurado
        if (usuario.email) {
          // Enviar email de notificação
          const resultado = await emailService.enviarNotificacaoVencimentos(usuario, vencimentos);
          
          if (resultado.success) {
            logger.info(`Email de notificação enviado para ${usuario.email}`);
            totalNotificacoes++;
          } else {
            logger.error(`Erro ao enviar email para ${usuario.email}`, { erro: resultado.error });
          }
        } else {
          logger.warn(`Usuário ${usuario.nome} (ID: ${usuario.id}) não possui email cadastrado`);
        }
      } else {
        logger.info(`Nenhum vencimento próximo para ${usuario.nome} (ID: ${usuario.id})`);
      }
    }
    
    logger.info(`Verificação de vencimentos concluída. Enviadas ${totalNotificacoes} notificações.`);
    
  } catch (error) {
    logger.error(`Erro ao verificar vencimentos: ${error.message}`, {
      stack: error.stack
    });
    process.exit(1);
  } finally {
    // Fechar conexão com o banco de dados
    await sequelize.close();
  }
}

// Executar a função principal
verificarVencimentos()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
