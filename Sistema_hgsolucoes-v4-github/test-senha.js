const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'postgres',  
  host: 'localhost',
  port: 5432,
  database: 'controle_financeiro'
});

(async () => {
  try {
    const usuario = await pool.query('SELECT * FROM usuarios WHERE login = \'admin\'');
    
    if (usuario.rows.length > 0) {
      const senhaCorreta = await bcrypt.compare('admin', usuario.rows[0].senha);
      console.log('Usuário admin encontrado');
      console.log('Senha admin funciona:', senhaCorreta);
      
      if (!senhaCorreta) {
        console.log('Atualizando senha para admin...');
        const novaSenha = await bcrypt.hash('admin', 10);
        await pool.query('UPDATE usuarios SET senha = $1 WHERE login = \'admin\'', [novaSenha]);
        console.log('Senha atualizada!');
      }
    }
    
    await pool.end();
  } catch (err) {
    console.error('Erro:', err.message);
  }
})();
