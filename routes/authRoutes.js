module.exports = (app) => {
  const authController = app.controllers.authController;
  
  // Rotas públicas (SEM autenticação)
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/register', authController.register);
  
  // Retorna o controller para uso em outras rotas
  return authController;
};
