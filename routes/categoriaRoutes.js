module.exports = (app) => {
  const catController = app.controllers.categoriaController;
  const router = require('express').Router();
  
  // Todas estas rotas precisam estar autenticadas
  // O middleware de autenticação já é aplicado em app.use('/api', authController.verificarToken)
  
  router.get('/categorias', catController.listar);
  router.get('/categorias/:id', catController.buscarPorId);
  router.post('/categorias', catController.adicionar);
  router.put('/categorias/:id', catController.atualizar);
  router.delete('/categorias/:id', catController.remover);
  
  return router;
};
