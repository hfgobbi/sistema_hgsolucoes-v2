const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [5, 100]
    }
  },
  login: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [5, 50]
    }
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  saldo: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'Usuarios',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

// Hook para criptografar a senha antes de salvar
Usuario.beforeCreate(async (usuario) => {
  if (usuario.senha) {
    const salt = await bcrypt.genSalt(10);
    usuario.senha = await bcrypt.hash(usuario.senha, salt);
  }
});

// Método para verificar senha
Usuario.prototype.verificarSenha = async function(senha) {
  console.log('verificarSenha - senha informada:', senha);
  console.log('verificarSenha - hash armazenado:', this.senha);
  const resultado = await bcrypt.compare(senha, this.senha);
  console.log('verificarSenha - resultado:', resultado);
  return resultado;
};

// Função para inicializar usuário admin
const inicializarAdmin = async () => {
  try {
    // Verifica se o usuário admin já existe
    const adminExistente = await Usuario.findOne({ where: { login: 'admin' } });
    if (!adminExistente) {
      // Cria o usuário admin
      await Usuario.create({
        nome: 'Administrador',
        login: 'admin',
        senha: 'admin123',
        data_nascimento: new Date('1990-01-01'),
        saldo: 0,
        admin: true
      });
      console.log('Usuário admin criado com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
  }
};

module.exports = { Usuario, inicializarAdmin };
