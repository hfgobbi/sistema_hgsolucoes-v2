/**
 * Rotas para geração de relatórios avançados
 */

module.exports = (app) => {
  const relatorioController = app.controllers.relatorioController;
  const router = require('express').Router();
  
  // Todas estas rotas precisam estar autenticadas
  // O middleware de autenticação já é aplicado em app.use('/api', authController.verificarToken)
  
  // Relatório de fluxo de caixa mensal
  router.get('/relatorios/fluxo-caixa', relatorioController.fluxoCaixaMensal);
  
  // Relatório de gastos por categoria
  router.get('/relatorios/gastos-categoria', relatorioController.gastosPorCategoria);
  
  // Relatório de evolução patrimonial
  router.get('/relatorios/evolucao-patrimonial', relatorioController.evolucaoPatrimonial);
  
  return router;
};
