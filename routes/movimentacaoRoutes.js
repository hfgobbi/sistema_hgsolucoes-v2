module.exports = (app) => {
  const movController = app.controllers.movimentacaoController;
  const router = require('express').Router();
  
  // Todas estas rotas precisam estar autenticadas
  // O middleware de autenticação já é aplicado em app.use('/api', authController.verificarToken)
  
  router.get('/movimentacoes', movController.listar);
  router.get('/movimentacoes/:id', movController.buscarPorId);
  router.post('/movimentacoes', movController.adicionar);
  router.put('/movimentacoes/:id', movController.atualizar);
  router.delete('/movimentacoes/:id', movController.remover);
  
  // Rota para estatísticas do dashboard
  router.get('/estatisticas', movController.estatisticas);
  
  // Rota para marcar uma movimentação como paga
  router.patch('/movimentacoes/:id/pagar', movController.marcarComoPago);
  
  return router;
};
