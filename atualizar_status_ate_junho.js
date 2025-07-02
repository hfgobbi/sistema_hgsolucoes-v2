const { Sequelize } = require('sequelize');

// Configuração do PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  username: 'postgres',
  password: 'postgres',
  logging: false
});

async function atualizarStatusAteMes() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o PostgreSQL estabelecida!');
    
    // Data limite: 30 de junho de 2025
    const dataLimite = '2025-06-30';
    
    // Atualizar todas as despesas até junho para status 'pago'
    const [resultado] = await sequelize.query(`
      UPDATE "Movimentacaos" 
      SET status_pagamento = 'pago'::enum_movimentacaos_status_pagamento 
      WHERE tipo = 'despesa' 
      AND data <= :dataLimite
    `, {
      replacements: { dataLimite }
    });
    
    console.log(`✅ ${resultado} movimentações de despesas até ${dataLimite} foram marcadas como pagas!`);
    
    console.log('Atualização concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a atualização:', error);
  } finally {
    await sequelize.close();
  }
}

atualizarStatusAteMes();
