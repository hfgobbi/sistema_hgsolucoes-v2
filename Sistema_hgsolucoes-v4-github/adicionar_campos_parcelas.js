const { sequelize } = require('./config/database');

async function adicionarCamposParcelas() {
  try {
    // Conectar ao banco de dados
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');
    
    // Adicionar campo parcelas_total
    await sequelize.query(`
      ALTER TABLE "Movimentacaos" 
      ADD COLUMN IF NOT EXISTS parcelas_total INTEGER DEFAULT NULL;
    `);
    console.log('Campo parcelas_total adicionado com sucesso.');
    
    // Adicionar campo parcela_atual
    await sequelize.query(`
      ALTER TABLE "Movimentacaos" 
      ADD COLUMN IF NOT EXISTS parcela_atual INTEGER DEFAULT NULL;
    `);
    console.log('Campo parcela_atual adicionado com sucesso.');
    
    // Adicionar campo movimentacao_pai_id para relacionar parcelas
    await sequelize.query(`
      ALTER TABLE "Movimentacaos" 
      ADD COLUMN IF NOT EXISTS movimentacao_pai_id INTEGER DEFAULT NULL;
    `);
    console.log('Campo movimentacao_pai_id adicionado com sucesso.');
    
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

adicionarCamposParcelas();
