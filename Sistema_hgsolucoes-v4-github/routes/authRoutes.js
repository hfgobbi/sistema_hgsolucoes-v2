module.exports = (app) => {
  const authController = app.controllers.authController;
  
  // Rotas públicas (SEM autenticação)
  app.post('/api/auth/login', authController.login);  // Rota original com /api
  app.post('/auth/login', authController.login);      // Rota alternativa sem /api
  
  app.post('/api/auth/register', authController.register); // Rota original com /api
  app.post('/auth/register', authController.register);     // Rota alternativa sem /api
  
  // Retorna o controller para uso em outras rotas
  return authController;
};
