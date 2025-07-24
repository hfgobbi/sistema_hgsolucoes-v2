/**
 * Script para diagnosticar problema de login
 */
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Conexão com o banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro',
  user: 'postgres',
  password: 'postgres'
});

async function diagnoseUser() {
  const client = await pool.connect();
  
  try {
    // Verificar formato do usuário admin
    const userResult = await client.query(
      'SELECT id, nome, login, senha, admin FROM usuarios WHERE login = $1',
      ['admin']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('\n=== DIAGNÓSTICO DE USUÁRIO ===');
    console.log(`ID: ${user.id}`);
    console.log(`Nome: ${user.nome}`);
    console.log(`Login: ${user.login}`);
    console.log(`Admin: ${user.admin ? 'Sim' : 'Não'}`);
    console.log(`Comprimento da senha hash: ${user.senha ? user.senha.length : 'N/A'}`);
    console.log(`Formato da senha: ${user.senha ? (user.senha.startsWith('$2') ? 'bcrypt válido' : 'formato desconhecido') : 'N/A'}`);
    
    // Testar comparação de senha
    const testPassword = 'admin123';
    try {
      const isMatch = await bcrypt.compare(testPassword, user.senha);
      console.log(`\nTeste de senha '${testPassword}': ${isMatch ? 'SUCESSO ✅' : 'FALHA ❌'}`);
      
      // Se falhar, tentar criar um hash novamente e comparar formatos
      if (!isMatch) {
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(testPassword, salt);
        console.log(`\nNovo hash para '${testPassword}': ${newHash}`);
        console.log(`Hash atual no banco: ${user.senha}`);
        console.log(`Comparação direta: ${newHash === user.senha ? 'Idênticos' : 'Diferentes'}`);
      }
    } catch (err) {
      console.error(`\n❌ Erro na comparação de senha: ${err.message}`);
    }
    
  } catch (error) {
    console.error('Erro ao diagnosticar usuário:', error);
  } finally {
    client.release();
    pool.end();
  }
}

// Executar função
diagnoseUser();
