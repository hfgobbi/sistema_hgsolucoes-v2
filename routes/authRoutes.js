module.exports = (app) => {
  const authController = app.controllers.authController;
  const router = require('express').Router();
  
  // Rotas públicas
  router.post('/login', authController.login);
  router.post('/register', authController.register);
  
  // Middleware para verificar token em rotas protegidas
  app.use('/api', authController.verificarToken);
  
  // Importante: registrar o roteador com o prefixo '/auth'
  app.use('/auth', router);
  
  return router;
};
