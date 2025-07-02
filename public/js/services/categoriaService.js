// Serviço de gerenciamento de categorias
app.service('categoriaService', ['$http', function($http) {
  var service = {};

  // URL base da API
  var baseUrl = '/api/categorias';

  // Listar todas as categorias
  service.listar = function() {
    return $http.get(baseUrl)
      .then(function(response) {
        return response.data;
      });
  };

  // Buscar categoria por ID
  service.buscarPorId = function(id) {
    return $http.get(baseUrl + '/' + id)
      .then(function(response) {
        return response.data;
      });
  };

  // Adicionar nova categoria
  service.adicionar = function(categoria) {
    return $http.post(baseUrl, categoria)
      .then(function(response) {
        return response.data;
      });
  };

  // Atualizar categoria
  service.atualizar = function(id, categoria) {
    return $http.put(baseUrl + '/' + id, categoria)
      .then(function(response) {
        return response.data;
      });
  };

  // Remover categoria
  service.remover = function(id) {
    return $http.delete(baseUrl + '/' + id)
      .then(function(response) {
        return response.data;
      });
  };

  return service;
}]);
