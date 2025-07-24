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

async function executarMigracao() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o PostgreSQL estabelecida!');
    
    // Verificar se as colunas já existem
    const [colunas] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'Movimentacaos' AND 
      column_name IN ('data_vencimento', 'status_pagamento')
    `);
    
    const colunasExistentes = colunas.map(col => col.column_name);
    
    // Adicionar coluna de data de vencimento se não existir
    if (!colunasExistentes.includes('data_vencimento')) {
      console.log('Adicionando coluna data_vencimento...');
      await sequelize.query(`
        ALTER TABLE "Movimentacaos" 
        ADD COLUMN data_vencimento DATE
      `);
      console.log('✅ Coluna data_vencimento adicionada com sucesso!');
      
      // Inicializar data_vencimento com a data das movimentações existentes
      await sequelize.query(`
        UPDATE "Movimentacaos" 
        SET data_vencimento = data
      `);
      console.log('✅ Valores de data_vencimento inicializados!');
    } else {
      console.log('Coluna data_vencimento já existe. Pulando...');
    }
    
    // Adicionar coluna de status de pagamento se não existir
    if (!colunasExistentes.includes('status_pagamento')) {
      console.log('Adicionando coluna status_pagamento...');
      
      // Criar o tipo ENUM se não existir
      await sequelize.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_movimentacaos_status_pagamento') THEN
            CREATE TYPE enum_movimentacaos_status_pagamento AS ENUM ('pago', 'pendente', 'a_pagar', 'vencido');
          END IF;
        END
        $$;
      `);
      
      // Adicionar a coluna com o tipo ENUM
      await sequelize.query(`
        ALTER TABLE "Movimentacaos" 
        ADD COLUMN status_pagamento enum_movimentacaos_status_pagamento DEFAULT 'pendente' NOT NULL
      `);
      
      console.log('✅ Coluna status_pagamento adicionada com sucesso!');
      
      // Inicializar status_pagamento baseado na data (com casting explícito)
      await sequelize.query(`
        UPDATE "Movimentacaos" 
        SET status_pagamento = CASE
          WHEN tipo = 'receita' THEN 'pago'::enum_movimentacaos_status_pagamento
          WHEN data <= CURRENT_DATE THEN 'vencido'::enum_movimentacaos_status_pagamento
          ELSE 'a_pagar'::enum_movimentacaos_status_pagamento
        END
      `);
      console.log('✅ Valores de status_pagamento inicializados!');
    } else {
      console.log('Coluna status_pagamento já existe. Pulando...');
    }
    
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await sequelize.close();
  }
}

executarMigracao();
