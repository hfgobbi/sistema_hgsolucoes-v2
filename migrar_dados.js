const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Configuração do SQLite (origem)
const sqliteSequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'backups', 'database_backup_20250630_130340.sqlite'),
  logging: false
});

// Configuração do PostgreSQL (destino)
const pgSequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  username: 'postgres',
  password: 'postgres',
  logging: false
});

// Função para obter os modelos do SQLite
async function obterModelosSQLite() {
  try {
    // Definir os modelos necessários para o SQLite
    const Usuario = sqliteSequelize.define('usuario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      email: Sequelize.STRING,
      senha: Sequelize.STRING,
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'usuarios' });

    const Categoria = sqliteSequelize.define('categoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      tipo: Sequelize.STRING,
      descricao: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'categorias' });

    const Conta = sqliteSequelize.define('conta', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      saldo: Sequelize.DECIMAL(10, 2),
      tipo: Sequelize.STRING,
      usuario_id: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'contas' });

    const Movimentacao = sqliteSequelize.define('movimentacao', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
      valor: Sequelize.DECIMAL(10, 2),
      data: Sequelize.DATE,
      tipo: Sequelize.STRING,
      categoria_id: Sequelize.INTEGER,
      conta_id: Sequelize.INTEGER,
      usuario_id: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'movimentacoes' });

    return {
      Usuario,
      Categoria,
      Conta,
      Movimentacao
    };
  } catch (error) {
    console.error('Erro ao definir modelos SQLite:', error);
    throw error;
  }
}

// Função para obter os modelos do PostgreSQL
async function obterModelosPostgreSQL() {
  try {
    // Definir os modelos necessários para o PostgreSQL
    const Usuario = pgSequelize.define('usuario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      email: Sequelize.STRING,
      senha: Sequelize.STRING,
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'usuarios' });

    const Categoria = pgSequelize.define('categoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      tipo: Sequelize.STRING,
      descricao: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'categorias' });

    const Conta = pgSequelize.define('conta', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      saldo: Sequelize.DECIMAL(10, 2),
      tipo: Sequelize.STRING,
      usuario_id: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'contas' });

    const Movimentacao = pgSequelize.define('movimentacao', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
      valor: Sequelize.DECIMAL(10, 2),
      data: Sequelize.DATE,
      tipo: Sequelize.STRING,
      categoria_id: Sequelize.INTEGER,
      conta_id: Sequelize.INTEGER,
      usuario_id: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    }, { tableName: 'movimentacoes' });

    return {
      Usuario,
      Categoria,
      Conta,
      Movimentacao
    };
  } catch (error) {
    console.error('Erro ao definir modelos PostgreSQL:', error);
    throw error;
  }
}

// Função principal para migrar dados
async function migrarDados() {
  try {
    console.log('Iniciando migração de dados do SQLite para PostgreSQL...');

    // Testar conexões
    await sqliteSequelize.authenticate();
    console.log('Conexão com SQLite estabelecida.');
    
    await pgSequelize.authenticate();
    console.log('Conexão com PostgreSQL estabelecida.');

    // Obter modelos
    const modelosSQLite = await obterModelosSQLite();
    const modelosPostgreSQL = await obterModelosPostgreSQL();

    // Sincronizar modelos PostgreSQL (criar tabelas se não existirem)
    await pgSequelize.sync();
    console.log('Estrutura de tabelas PostgreSQL sincronizada.');

    // Migrar usuários
    const usuarios = await modelosSQLite.Usuario.findAll();
    console.log(`Encontrados ${usuarios.length} usuários para migrar.`);
    for (const usuario of usuarios) {
      await modelosPostgreSQL.Usuario.create(usuario.toJSON());
    }
    console.log('✓ Migração de usuários concluída.');

    // Migrar categorias
    const categorias = await modelosSQLite.Categoria.findAll();
    console.log(`Encontradas ${categorias.length} categorias para migrar.`);
    for (const categoria of categorias) {
      await modelosPostgreSQL.Categoria.create(categoria.toJSON());
    }
    console.log('✓ Migração de categorias concluída.');

    // Migrar contas
    const contas = await modelosSQLite.Conta.findAll();
    console.log(`Encontradas ${contas.length} contas para migrar.`);
    for (const conta of contas) {
      await modelosPostgreSQL.Conta.create(conta.toJSON());
    }
    console.log('✓ Migração de contas concluída.');

    // Migrar movimentações
    const movimentacoes = await modelosSQLite.Movimentacao.findAll();
    console.log(`Encontradas ${movimentacoes.length} movimentações para migrar.`);
    for (const movimentacao of movimentacoes) {
      await modelosPostgreSQL.Movimentacao.create(movimentacao.toJSON());
    }
    console.log('✓ Migração de movimentações concluída.');

    console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    process.exit(0);
  } catch (error) {
    console.error('Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
migrarDados();
