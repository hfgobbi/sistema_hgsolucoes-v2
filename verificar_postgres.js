const { Sequelize } = require('sequelize');

// Configuração do PostgreSQL (destino)
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  username: 'postgres',
  password: 'postgres',
  logging: console.log  // Habilitar logs para debug
});

async function verificarBanco() {
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida com sucesso.');

    // Verificar tabelas no banco
    const [tabelas] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    
    console.log('\nTabelas encontradas:');
    console.log(tabelas.map(t => t.table_name));

    // Verificar dados nas tabelas
    if (tabelas.some(t => t.table_name === 'usuarios')) {
      const [usuarios] = await sequelize.query('SELECT COUNT(*) FROM "Usuarios"');
      console.log('\nUsuários encontrados:', usuarios[0].count);
    }

    if (tabelas.some(t => t.table_name === 'categoria')) {
      const [categorias] = await sequelize.query('SELECT COUNT(*) FROM "Categoria"');
      console.log('Categorias encontradas:', categorias[0].count);
    }

    if (tabelas.some(t => t.table_name === 'movimentacaos')) {
      const [movimentacoes] = await sequelize.query('SELECT COUNT(*) FROM "Movimentacaos"');
      console.log('Movimentações encontradas:', movimentacoes[0].count);
    }
    
  } catch (error) {
    console.error('Erro ao verificar o banco:', error);
  } finally {
    await sequelize.close();
  }
}

verificarBanco();
