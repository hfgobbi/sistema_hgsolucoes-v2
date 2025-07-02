const { Sequelize, DataTypes } = require('sequelize');
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

async function verificarECorrigir() {
  try {
    console.log('Iniciando verificação e correção do banco PostgreSQL...');

    // Verificar conexões
    await sqliteSequelize.authenticate();
    console.log('✓ Conexão com SQLite estabelecida.');
    
    await pgSequelize.authenticate();
    console.log('✓ Conexão com PostgreSQL estabelecida.');

    // 1. LIMPAR BANCO POSTGRESQL COMPLETAMENTE
    console.log('Removendo tabelas existentes no PostgreSQL para evitar conflitos...');
    
    try {
      // Remover tabelas na ordem correta por causa das chaves estrangeiras
      await pgSequelize.query('DROP TABLE IF EXISTS "Movimentacaos" CASCADE;');
      await pgSequelize.query('DROP TABLE IF EXISTS "Categoria" CASCADE;');
      await pgSequelize.query('DROP TABLE IF EXISTS "Usuarios" CASCADE;');
      console.log('✓ Tabelas removidas com sucesso.');
    } catch (error) {
      console.error('Erro ao remover tabelas:', error.message);
    }

    // 2. CRIAR TABELAS NOVAMENTE
    console.log('Criando tabelas no PostgreSQL...');
    
    // Criar tabela de Usuários
    await pgSequelize.query(`
      CREATE TABLE "Usuarios" (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        login VARCHAR(255) NOT NULL,
        senha VARCHAR(255) NOT NULL,
        data_nascimento DATE NOT NULL,
        saldo DECIMAL(10,2),
        admin BOOLEAN,
        data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
        data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    
    // Criar tabela de Categorias
    await pgSequelize.query(`
      CREATE TABLE "Categoria" (
        id SERIAL PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL,
        usuario_id INTEGER NOT NULL REFERENCES "Usuarios"(id),
        data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
        data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    
    // Criar tabela de Movimentações
    await pgSequelize.query(`
      CREATE TABLE "Movimentacaos" (
        id SERIAL PRIMARY KEY,
        descricao VARCHAR(255) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        tipo VARCHAR(255) NOT NULL,
        data DATE NOT NULL,
        observacao TEXT,
        tipo_frequencia VARCHAR(255),
        usuario_id INTEGER NOT NULL REFERENCES "Usuarios"(id),
        categoria_id INTEGER NOT NULL REFERENCES "Categoria"(id),
        data_criacao TIMESTAMP WITH TIME ZONE NOT NULL,
        data_atualizacao TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `);
    
    console.log('✓ Tabelas criadas com sucesso.');

    // 3. MIGRAR DADOS DO SQLITE
    console.log('\nMigrando dados do SQLite para PostgreSQL...');
    
    // Definir modelos SQLite
    const SQLiteUsuario = sqliteSequelize.define('Usuario', {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      nome: DataTypes.STRING,
      login: DataTypes.STRING,
      senha: DataTypes.STRING,
      data_nascimento: DataTypes.DATE,
      saldo: DataTypes.DECIMAL(10, 2),
      admin: DataTypes.BOOLEAN,
      data_criacao: DataTypes.DATE,
      data_atualizacao: DataTypes.DATE
    }, {
      tableName: 'Usuarios',
      timestamps: false
    });

    const SQLiteCategoria = sqliteSequelize.define('Categoria', {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      descricao: DataTypes.STRING,
      usuario_id: DataTypes.INTEGER,
      data_criacao: DataTypes.DATE,
      data_atualizacao: DataTypes.DATE
    }, {
      tableName: 'Categoria',
      timestamps: false
    });

    const SQLiteMovimentacao = sqliteSequelize.define('Movimentacao', {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      descricao: DataTypes.STRING,
      valor: DataTypes.DECIMAL(10, 2),
      tipo: DataTypes.STRING,
      data: DataTypes.DATE,
      observacao: DataTypes.TEXT,
      tipo_frequencia: DataTypes.STRING,
      usuario_id: DataTypes.INTEGER,
      categoria_id: DataTypes.INTEGER,
      data_criacao: DataTypes.DATE,
      data_atualizacao: DataTypes.DATE
    }, {
      tableName: 'Movimentacaos',
      timestamps: false
    });

    // Obter dados do SQLite
    const usuarios = await SQLiteUsuario.findAll();
    console.log(`Encontrados ${usuarios.length} usuários no SQLite.`);
    
    const categorias = await SQLiteCategoria.findAll();
    console.log(`Encontradas ${categorias.length} categorias no SQLite.`);
    
    const movimentacoes = await SQLiteMovimentacao.findAll();
    console.log(`Encontradas ${movimentacoes.length} movimentações no SQLite.`);

    // Inserir dados no PostgreSQL usando SQL bruto para controle total
    console.log('\nInserindo dados no PostgreSQL...');
    
    // Inserir usuários
    console.log('Inserindo usuários...');
    for (const usuario of usuarios) {
      const u = usuario.toJSON();
      await pgSequelize.query(`
        INSERT INTO "Usuarios" (id, nome, login, senha, data_nascimento, saldo, admin, data_criacao, data_atualizacao)
        VALUES (:id, :nome, :login, :senha, :data_nascimento, :saldo, :admin, :data_criacao, :data_atualizacao)
      `, {
        replacements: {
          id: u.id,
          nome: u.nome,
          login: u.login,
          senha: u.senha,
          data_nascimento: u.data_nascimento,
          saldo: u.saldo || 0,
          admin: u.admin || false,
          data_criacao: u.data_criacao,
          data_atualizacao: u.data_atualizacao
        }
      });
    }
    console.log('✓ Usuários inseridos.');

    // Inserir categorias
    console.log('Inserindo categorias...');
    for (const categoria of categorias) {
      const c = categoria.toJSON();
      await pgSequelize.query(`
        INSERT INTO "Categoria" (id, descricao, usuario_id, data_criacao, data_atualizacao)
        VALUES (:id, :descricao, :usuario_id, :data_criacao, :data_atualizacao)
      `, {
        replacements: {
          id: c.id,
          descricao: c.descricao,
          usuario_id: c.usuario_id,
          data_criacao: c.data_criacao,
          data_atualizacao: c.data_atualizacao
        }
      });
    }
    console.log('✓ Categorias inseridas.');

    // Inserir movimentações
    console.log('Inserindo movimentações...');
    for (const movimentacao of movimentacoes) {
      const m = movimentacao.toJSON();
      await pgSequelize.query(`
        INSERT INTO "Movimentacaos" (id, descricao, valor, tipo, data, observacao, tipo_frequencia, usuario_id, categoria_id, data_criacao, data_atualizacao)
        VALUES (:id, :descricao, :valor, :tipo, :data, :observacao, :tipo_frequencia, :usuario_id, :categoria_id, :data_criacao, :data_atualizacao)
      `, {
        replacements: {
          id: m.id,
          descricao: m.descricao,
          valor: m.valor,
          tipo: m.tipo,
          data: m.data,
          observacao: m.observacao,
          tipo_frequencia: m.tipo_frequencia,
          usuario_id: m.usuario_id,
          categoria_id: m.categoria_id,
          data_criacao: m.data_criacao,
          data_atualizacao: m.data_atualizacao
        }
      });
    }
    console.log('✓ Movimentações inseridas.');
    
    // 4. Configurar sequências para não haver conflitos de ID
    console.log('\nConfigurando sequências do PostgreSQL...');
    await pgSequelize.query(`SELECT setval('"Usuarios_id_seq"', (SELECT MAX(id) FROM "Usuarios"));`);
    await pgSequelize.query(`SELECT setval('"Categoria_id_seq"', (SELECT MAX(id) FROM "Categoria"));`);
    await pgSequelize.query(`SELECT setval('"Movimentacaos_id_seq"', (SELECT MAX(id) FROM "Movimentacaos"));`);
    console.log('✓ Sequências configuradas.');

    console.log('\n✅ BANCO DE DADOS CORRIGIDO COM SUCESSO!');
    process.exit(0);
  } catch (error) {
    console.error('\nERRO DURANTE A CORREÇÃO:', error);
    process.exit(1);
  } finally {
    await sqliteSequelize.close();
    await pgSequelize.close();
  }
}

verificarECorrigir();
