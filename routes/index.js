module.exports = (app) => {
  const authRoutes = require('./authRoutes')(app);
  const movimentacaoRoutes = require('./movimentacaoRoutes')(app);
  const categoriaRoutes = require('./categoriaRoutes')(app);
  const debugRoutes = require('./debugRoutes')(app);
  
  // Configurar as rotas de autenticação
  app.use('/auth', authRoutes);
  
  // Configurar as rotas da API (protegidas por autenticação)
  app.use('/api', movimentacaoRoutes);
  app.use('/api', categoriaRoutes);
  app.use('/api', debugRoutes);
  
  return app;
};
