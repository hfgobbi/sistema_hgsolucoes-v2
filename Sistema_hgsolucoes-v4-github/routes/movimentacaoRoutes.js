module.exports = app => {
  const movimentacaoController = app.controllers.movimentacaoController;
  
  // IMPORTANTE: Ordem de definição de rotas é crítica no Express!
  // Rotas específicas devem vir ANTES das rotas com parâmetros
  
  // Rota de estatísticas para dashboard
  app.route('/api/movimentacoes/resumo')
    .all(app.controllers.authController.verificarToken)
    .get(movimentacaoController.estatisticas);
  
  app.route('/api/movimentacoes')
    .all(app.controllers.authController.verificarToken)
    .get(movimentacaoController.listar)
    .post(movimentacaoController.adicionar);
  
  // Rota para marcar como pago (precisa vir antes da rota genérica com :id)
  app.route('/api/movimentacoes/:id/marcar-pago')
    .all(app.controllers.authController.verificarToken)
    .put(movimentacaoController.marcarComoPago);
  
  // Rota para operações com ID específico (precisa vir por último)
  app.route('/api/movimentacoes/:id')
    .all(app.controllers.authController.verificarToken)
    .get(movimentacaoController.buscarPorId)
    .put(movimentacaoController.atualizar)
    .delete(movimentacaoController.remover);
};