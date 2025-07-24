const { Usuario } = require('./models/Usuario');

(async () => {
  try {
    const usuario = await Usuario.findOne({ where: { login: 'admin' } });
    
    if (usuario) {
      console.log('Usuário encontrado:', usuario.login);
      console.log('Testando senha admin...');
      
      const senhaCorreta = await usuario.verificarSenha('admin');
      console.log('Resultado:', senhaCorreta);
      
      // Teste direto com bcrypt
      const bcrypt = require('bcryptjs');
      const testeDireto = await bcrypt.compare('admin', usuario.senha);
      console.log('Teste direto bcrypt:', testeDireto);
    }
  } catch (err) {
    console.error('Erro:', err.message);
  }
})();
