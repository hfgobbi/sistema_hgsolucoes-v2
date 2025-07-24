const { Sequelize } = require('sequelize');

// Configurando o Sequelize para usar PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'sistema_hg_v3',
  username: 'herculesgobbi',
  password: '',
  // NOTA: Ajustado para usar o usuário proprietário do banco conforme verificado
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

