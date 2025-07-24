module.exports = (app) => {
  require('./authRoutes')(app);
  require('./movimentacaoRoutes')(app);
  require('./categoriaRoutes')(app);
  require('./debugRoutes')(app);
  require('./relatorioRoutes')(app);
  require('./exportRoutes')(app);
  require('./dashboardRoutes')(app);
  
  return app;
};
