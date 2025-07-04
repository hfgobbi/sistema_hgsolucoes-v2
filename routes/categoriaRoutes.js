module.exports = app => {
  const catController = app.controllers.categoriaController;
  
  // Rota para listar e adicionar categorias
  app.route('/api/categorias')
    .all(app.controllers.authController.verificarToken)
    .get(catController.listar)
    .post(catController.adicionar);
  
  // Rota para operações com ID específico
  app.route('/api/categorias/:id')
    .all(app.controllers.authController.verificarToken)
    .get(catController.buscarPorId)
    .put(catController.atualizar)
    .delete(catController.remover);
};
