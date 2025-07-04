module.exports = app => {
  const dashboardController = app.controllers.dashboardController;
  
  // Rota para obter resumo mensal
  app.route('/api/dashboard/resumo')
    .all(app.controllers.authController.verificarToken)
    .get(dashboardController.getResumoMensal);
    
  // Rota para obter próximos vencimentos
  app.route('/api/dashboard/proximos-vencimentos')
    .all(app.controllers.authController.verificarToken)
    .get(dashboardController.getProximosVencimentos);
    
  // Rota para obter últimas movimentações
  app.route('/api/dashboard/ultimas-movimentacoes')
    .all(app.controllers.authController.verificarToken)
    .get(dashboardController.getUltimasMovimentacoes);
    
  // Rota para marcar como pago via dashboard
  app.route('/api/dashboard/marcar-pago/:id')
    .all(app.controllers.authController.verificarToken)
    .put(dashboardController.marcarComoPago);

  // Rotas adicionais para os novos endpoints
  app.route('/api/dashboard/parcelas-abertas')
    .all(app.controllers.authController.verificarToken)
    .get(dashboardController.getParcelasAbertas);
    
  app.route('/api/dashboard/movimentacoes-periodo')
    .all(app.controllers.authController.verificarToken)
    .get(dashboardController.getMovimentacoesPeriodo);
    
  app.route('/api/dashboard/tendencias-comparativas')
    .all(app.controllers.authController.verificarToken)
    .get(dashboardController.getTendenciasComparativas);
};