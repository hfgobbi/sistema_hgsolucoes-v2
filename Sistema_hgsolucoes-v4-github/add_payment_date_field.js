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

async function adicionarCampoDataPagamento() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o PostgreSQL estabelecida!');

    // 1. Verificar se a coluna já existe
    const verificarColuna = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Movimentacaos' AND column_name = 'data_pagamento'
    `);
    
    if (verificarColuna[0].length > 0) {
      console.log('A coluna data_pagamento já existe. Pulando criação.');
    } else {
      // 2. Adicionar coluna data_pagamento
      await sequelize.query(`
        ALTER TABLE "Movimentacaos" 
        ADD COLUMN data_pagamento DATE NULL
      `);
      console.log('Coluna data_pagamento adicionada com sucesso!');
    }
    
    // 3. Para registros que já estão como 'pago', usar a data da movimentação como data de pagamento
    await sequelize.query(`
      UPDATE "Movimentacaos" 
      SET data_pagamento = data 
      WHERE status_pagamento = 'pago'::enum_movimentacaos_status_pagamento 
      AND data_pagamento IS NULL
    `);
    console.log('Valores padrão para data_pagamento foram configurados!');
    
    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await sequelize.close();
  }
}

adicionarCampoDataPagamento();
