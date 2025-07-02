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

async function verificarDados() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco estabelecida!');

    // Verificar anos disponíveis nas movimentações
    const [anosResultado] = await sequelize.query(`
      SELECT DISTINCT EXTRACT(YEAR FROM data) as ano
      FROM "Movimentacaos"
      ORDER BY ano
    `);
    
    console.log('\nAnos disponíveis nas movimentações:');
    console.log(anosResultado);
    
    // Verificar quantidade total de movimentações
    const [totalResultado] = await sequelize.query(`
      SELECT COUNT(*) as total FROM "Movimentacaos"
    `);
    
    console.log(`\nTotal de movimentações: ${totalResultado[0].total}`);
    
    // Verificar saldo do usuário
    const [saldoResultado] = await sequelize.query(`
      SELECT id, nome, login, saldo FROM "Usuarios"
    `);
    
    console.log('\nInformações do usuário:');
    console.log(saldoResultado);
    
    // Verificar algumas movimentações recentes
    const [movimentacoes] = await sequelize.query(`
      SELECT id, descricao, valor, tipo, data, categoria_id
      FROM "Movimentacaos"
      ORDER BY data DESC
      LIMIT 5
    `);
    
    console.log('\nMovimentações mais recentes:');
    console.log(movimentacoes);

    await sequelize.close();
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  }
}

verificarDados();
