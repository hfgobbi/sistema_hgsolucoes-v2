const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { Usuario } = require('./Usuario');
const { Categoria } = require('./Categoria');

const Movimentacao = sequelize.define('Movimentacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: false
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('receita', 'despesa'),
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo_frequencia: {
    type: DataTypes.ENUM('unica', 'fixa', 'parcelada'),
    defaultValue: 'unica'
  },
  data_vencimento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status_pagamento: {
    type: DataTypes.ENUM('pago', 'pendente', 'a_pagar', 'vencido', 'cancelado'),
    defaultValue: 'pendente',
    allowNull: false
  },
  data_pagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  parcelas_total: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  parcela_atual: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  movimentacao_pai_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Movimentacaos',
      key: 'id'
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Usuario,
      key: 'id'
    },
    allowNull: false
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Categoria,
      key: 'id'
    },
    allowNull: false
  }
}, {
  tableName: 'Movimentacaos',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'data_atualizacao'
});

// Estabelecer relacionamentos
Movimentacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(Movimentacao, { foreignKey: 'usuario_id', as: 'movimentacoes' });

Movimentacao.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Movimentacao, { foreignKey: 'categoria_id', as: 'movimentacoes' });

// Hook para atualizar saldo do usuário após criação/atualização/exclusão de movimentação
Movimentacao.afterCreate(async (movimentacao) => {
  await atualizarSaldo(movimentacao.usuario_id);
});

Movimentacao.afterUpdate(async (movimentacao) => {
  await atualizarSaldo(movimentacao.usuario_id);
});

Movimentacao.afterDestroy(async (movimentacao) => {
  await atualizarSaldo(movimentacao.usuario_id);
});

// Função para calcular e atualizar saldo
async function atualizarSaldo(usuarioId) {
  try {
    // Buscar todas as movimentações do usuário
    const movimentacoes = await Movimentacao.findAll({
      where: { usuario_id: usuarioId }
    });

    // Calcular saldo
    let saldo = 0;
    movimentacoes.forEach(mov => {
      if (mov.tipo === 'receita') {
        saldo += parseFloat(mov.valor);
      } else {
        saldo -= parseFloat(mov.valor);
      }
    });

    // Atualizar saldo do usuário
    await Usuario.update({ saldo }, {
      where: { id: usuarioId }
    });

    console.log(`Saldo do usuário ${usuarioId} atualizado para: ${saldo}`);
  } catch (error) {
    console.error('Erro ao atualizar saldo:', error);
  }
}

module.exports = { Movimentacao };
