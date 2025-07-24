const { Sequelize } = require('sequelize');
const path = require('path');

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

// Função para obter os modelos do SQLite com a estrutura real
async function obterModelosSQLite() {
  try {
    // Definir os modelos de acordo com a estrutura real do SQLite
    const Usuario = sqliteSequelize.define('Usuario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      login: Sequelize.STRING,
      senha: Sequelize.STRING,
      data_nascimento: Sequelize.DATE,
      saldo: Sequelize.DECIMAL(10, 2),
      admin: Sequelize.BOOLEAN,
      data_criacao: { type: Sequelize.DATE, field: 'data_criacao' },
      data_atualizacao: { type: Sequelize.DATE, field: 'data_atualizacao' }
    }, { 
      tableName: 'Usuarios',
      timestamps: false
    });

    const Categoria = sqliteSequelize.define('Categoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
      usuario_id: Sequelize.INTEGER,
      data_criacao: { type: Sequelize.DATE, field: 'data_criacao' },
      data_atualizacao: { type: Sequelize.DATE, field: 'data_atualizacao' }
    }, { 
      tableName: 'Categoria', 
      timestamps: false
    });

    const Movimentacao = sqliteSequelize.define('Movimentacao', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
      valor: Sequelize.DECIMAL(10, 2),
      tipo: Sequelize.STRING,
      data: Sequelize.DATE,
      observacao: Sequelize.TEXT,
      tipo_frequencia: Sequelize.STRING,
      usuario_id: Sequelize.INTEGER,
      categoria_id: Sequelize.INTEGER,
      data_criacao: { type: Sequelize.DATE, field: 'data_criacao' },
      data_atualizacao: { type: Sequelize.DATE, field: 'data_atualizacao' }
    }, { 
      tableName: 'Movimentacaos',
      timestamps: false
    });

    return {
      Usuario,
      Categoria,
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
    // Definir os modelos com a mesma estrutura para o PostgreSQL
    const Usuario = pgSequelize.define('Usuario', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome: Sequelize.STRING,
      login: Sequelize.STRING,
      senha: Sequelize.STRING,
      data_nascimento: Sequelize.DATE,
      saldo: Sequelize.DECIMAL(10, 2),
      admin: Sequelize.BOOLEAN,
      data_criacao: { type: Sequelize.DATE, field: 'data_criacao' },
      data_atualizacao: { type: Sequelize.DATE, field: 'data_atualizacao' }
    }, { 
      tableName: 'Usuarios',
      timestamps: false,
      createdAt: false,
      updatedAt: false
    });

    const Categoria = pgSequelize.define('Categoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
      usuario_id: Sequelize.INTEGER,
      data_criacao: { type: Sequelize.DATE, field: 'data_criacao' },
      data_atualizacao: { type: Sequelize.DATE, field: 'data_atualizacao' }
    }, { 
      tableName: 'Categoria',
      timestamps: false,
      createdAt: false,
      updatedAt: false
    });

    const Movimentacao = pgSequelize.define('Movimentacao', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      descricao: Sequelize.STRING,
      valor: Sequelize.DECIMAL(10, 2),
      tipo: Sequelize.STRING,
      data: Sequelize.DATE,
      observacao: Sequelize.TEXT,
      tipo_frequencia: Sequelize.STRING,
      usuario_id: Sequelize.INTEGER,
      categoria_id: Sequelize.INTEGER,
      data_criacao: { type: Sequelize.DATE, field: 'data_criacao' },
      data_atualizacao: { type: Sequelize.DATE, field: 'data_atualizacao' }
    }, { 
      tableName: 'Movimentacaos',
      timestamps: false,
      createdAt: false,
      updatedAt: false
    });

    return {
      Usuario,
      Categoria,
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
    await pgSequelize.sync({ force: true });
    console.log('Estrutura de tabelas PostgreSQL sincronizada.');

    // Migrar usuários
    const usuarios = await modelosSQLite.Usuario.findAll();
    console.log(`Encontrados ${usuarios.length} usuários para migrar.`);
    for (const usuario of usuarios) {
      const dadosUsuario = usuario.toJSON();
      await modelosPostgreSQL.Usuario.create(dadosUsuario);
    }
    console.log('✓ Migração de usuários concluída.');

    // Migrar categorias
    const categorias = await modelosSQLite.Categoria.findAll();
    console.log(`Encontradas ${categorias.length} categorias para migrar.`);
    for (const categoria of categorias) {
      const dadosCategoria = categoria.toJSON();
      await modelosPostgreSQL.Categoria.create(dadosCategoria);
    }
    console.log('✓ Migração de categorias concluída.');

    // Migrar movimentações
    const movimentacoes = await modelosSQLite.Movimentacao.findAll();
    console.log(`Encontradas ${movimentacoes.length} movimentações para migrar.`);
    for (const movimentacao of movimentacoes) {
      const dadosMovimentacao = movimentacao.toJSON();
      await modelosPostgreSQL.Movimentacao.create(dadosMovimentacao);
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
