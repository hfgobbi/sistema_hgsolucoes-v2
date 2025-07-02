const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o arquivo de backup do banco de dados SQLite
const dbPath = path.join(__dirname, 'backups', 'database_backup_20250630_130340.sqlite');

// Abrir conexão com o banco de dados
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Função para listar todas as tabelas
function listarTabelas() {
  return new Promise((resolve, reject) => {
    const query = `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`;
    db.all(query, [], (err, tabelas) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(tabelas.map(t => t.name));
    });
  });
}

// Função para obter a estrutura de uma tabela
function obterEstrutura(tabela) {
  return new Promise((resolve, reject) => {
    const query = `PRAGMA table_info(${tabela})`;
    db.all(query, [], (err, colunas) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        tabela,
        colunas: colunas.map(col => ({
          name: col.name,
          type: col.type,
          notnull: col.notnull === 1,
          dflt_value: col.dflt_value,
          pk: col.pk === 1
        }))
      });
    });
  });
}

// Função para obter uma amostra de dados de uma tabela
function obterAmostra(tabela, limite = 3) {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM ${tabela} LIMIT ${limite}`;
    db.all(query, [], (err, linhas) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ tabela, amostra: linhas });
    });
  });
}

// Função principal
async function analisarBancoDados() {
  try {
    console.log('\n=== ESTRUTURA DO BANCO DE DADOS SQLITE ===\n');
    
    // Listar todas as tabelas
    const tabelas = await listarTabelas();
    console.log(`Tabelas encontradas (${tabelas.length}): ${tabelas.join(', ')}\n`);
    
    // Para cada tabela, mostrar sua estrutura e uma amostra dos dados
    for (const tabela of tabelas) {
      const estrutura = await obterEstrutura(tabela);
      const amostra = await obterAmostra(tabela);
      
      console.log(`TABELA: ${tabela}`);
      console.log('Estrutura:');
      estrutura.colunas.forEach(col => {
        console.log(`  - ${col.name} (${col.type})${col.pk ? ' [PK]' : ''}${col.notnull ? ' [NOT NULL]' : ''}`);
      });
      
      console.log('\nAmostra de dados:');
      if (amostra.amostra.length > 0) {
        console.log(JSON.stringify(amostra.amostra, null, 2));
      } else {
        console.log('  (tabela vazia)');
      }
      console.log('\n' + '-'.repeat(50) + '\n');
    }
    
  } catch (error) {
    console.error('Erro durante a análise:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar o banco de dados:', err.message);
      }
      console.log('Conexão com o banco de dados fechada');
    });
  }
}

// Executar a análise
analisarBancoDados();
