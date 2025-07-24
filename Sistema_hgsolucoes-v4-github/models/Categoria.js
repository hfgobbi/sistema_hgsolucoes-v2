const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Usuario } = require('./Usuario');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Usuario,
      key: 'id'
    },
    allowNull: false
  }
}, {
  tableName: 'Categoria',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

// Estabelecer relacionamento
Categoria.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Categoria, { foreignKey: 'usuario_id', as: 'categorias' });

// Função para inicializar categorias padrão
const inicializarCategorias = async (usuarioId) => {
  const categoriasIniciais = [
    { descricao: 'Moradia', usuario_id: usuarioId },
    { descricao: 'Alimentação', usuario_id: usuarioId },
    { descricao: 'Transporte', usuario_id: usuarioId },
    { descricao: 'Saúde', usuario_id: usuarioId },
    { descricao: 'Educação', usuario_id: usuarioId },
    { descricao: 'Lazer', usuario_id: usuarioId },
    { descricao: 'Salário', usuario_id: usuarioId },
    { descricao: 'Freelance', usuario_id: usuarioId },
    { descricao: 'Outros', usuario_id: usuarioId }
  ];
  
  try {
    for (const cat of categoriasIniciais) {
      const [categoria, criado] = await Categoria.findOrCreate({
        where: { descricao: cat.descricao, usuario_id: usuarioId },
        defaults: cat
      });
    }
    console.log('Categorias iniciais criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar categorias iniciais:', error);
  }
};

module.exports = { Categoria, inicializarCategorias };
