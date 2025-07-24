/**
 * Script para verificar usuários existentes no banco de dados
 */
const { Pool } = require('pg');

// Conexão com o banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  user: 'postgres',
  password: 'postgres'
});

async function checkUsers() {
  try {
    // Buscar todos os usuários
    const result = await pool.query('SELECT id, nome, login, admin FROM usuarios');
    
    console.log('\n=== USUÁRIOS CADASTRADOS ===');
    if (result.rows.length === 0) {
      console.log('Nenhum usuário encontrado.');
    } else {
      result.rows.forEach(user => {
        console.log(`ID: ${user.id} | Nome: ${user.nome} | Login: ${user.login} | Admin: ${user.admin ? 'Sim' : 'Não'}`);
      });
    }
    console.log('\n');
    
  } catch (error) {
    console.error('Erro ao verificar usuários:', error);
  } finally {
    pool.end();
  }
}

// Executar a função
checkUsers();
