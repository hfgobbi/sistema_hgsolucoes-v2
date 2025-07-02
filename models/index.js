const { sequelize } = require('../config/database');
const { Usuario, inicializarAdmin } = require('./Usuario');
const { Categoria, inicializarCategorias } = require('./Categoria');
const { Movimentacao } = require('./Movimentacao');

// Função para inicializar o banco de dados
const inicializarBancoDados = async () => {
  try {
    // Sincroniza os modelos com o banco de dados
    await sequelize.sync({ force: false });
    
    // Inicializa o usuário admin
    await inicializarAdmin();
    
    // Busca o usuário admin para criar categorias padrão
    const admin = await Usuario.findOne({ where: { login: 'admin' } });
    if (admin) {
      await inicializarCategorias(admin.id);
    }
    
    console.log('Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  }
};

// Exporta os modelos e a função de inicialização
module.exports = (app) => {
  app.models = {
    Usuario,
    Categoria,
    Movimentacao
  };
  
  // Inicializa o banco de dados
  inicializarBancoDados();
  
  return app;
};
