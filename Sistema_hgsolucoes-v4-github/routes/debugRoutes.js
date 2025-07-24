module.exports = (app) => {
  const debugController = app.controllers.debugController;
  const router = require('express').Router();
  
  // Rota para executar consulta SQL (apenas para desenvolvimento)
  // O middleware de autenticação já é aplicado em app.use('/api', authController.verificarToken)
  router.post('/debug/sql', debugController.executarSQL);
  
  return router;
};
