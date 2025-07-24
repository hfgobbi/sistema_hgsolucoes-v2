/**
 * Rotas para exportação de dados
 */

module.exports = (app) => {
  const exportController = app.controllers.exportController;
  const router = require('express').Router();
  
  // Todas estas rotas precisam estar autenticadas
  // O middleware de autenticação já é aplicado em app.use('/api', authController.verificarToken)
  
  // Exportação para CSV
  router.get('/export/csv', exportController.exportarCSV);
  
  // Exportação para JSON
  router.get('/export/json', exportController.exportarJSON);
  
  return router;
};
