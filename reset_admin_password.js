/**
 * Script para resetar a senha do usuário administrador
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

async function resetAdminPassword() {
  const client = await pool.connect();
  
  try {
    // Iniciar transação
    await client.query('BEGIN');
    
    // Gerar hash da nova senha
    const novaSenha = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(novaSenha, salt);
    
    // Atualizar a senha do administrador (ID 1)
    const result = await client.query(
      'UPDATE usuarios SET senha = $1 WHERE id = 1 AND login = $2 RETURNING id, nome, login',
      [senhaHash, 'admin']
    );
    
    // Confirmar transação
    await client.query('COMMIT');
    
    if (result.rows.length > 0) {
      console.log(`\n✅ Senha do usuário ${result.rows[0].nome} (${result.rows[0].login}) resetada com sucesso!`);
      console.log(`Nova senha: ${novaSenha}`);
    } else {
      console.log('❌ Usuário administrador não encontrado.');
    }
    
  } catch (error) {
    // Reverter em caso de erro
    await client.query('ROLLBACK');
    console.error('Erro ao resetar senha:', error);
  } finally {
    // Liberar cliente
    client.release();
    // Encerrar pool
    pool.end();
  }
}

// Executar função
resetAdminPassword();
