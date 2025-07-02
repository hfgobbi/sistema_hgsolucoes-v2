const { Sequelize } = require('sequelize');

// Configurando o Sequelize para usar PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  username: 'postgres',
  password: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Testar a conexão
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o PostgreSQL estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('Não foi possível conectar ao PostgreSQL:', err);
  });

module.exports = { sequelize };

