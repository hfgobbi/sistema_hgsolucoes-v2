// Serviço de autenticação
app.service('authService', ['$http', '$q', '$location', function($http, $q, $location) {
  var service = {};

  // URL base da API
  var baseUrl = '/auth';

  // Verificar se o usuário está autenticado
  service.isAutenticado = function() {
    return !!localStorage.getItem('token');
  };

  // Obter o usuário logado
  service.getUsuario = function() {
    var usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  };

  // Realizar login
  service.login = function(credenciais) {
    return $http.post(baseUrl + '/login', credenciais)
      .then(function(response) {
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('usuario', JSON.stringify({
            id: response.data.id,
            nome: response.data.nome,
            login: response.data.login,
            saldo: response.data.saldo,
            admin: response.data.admin
          }));
          return response.data;
        }
        return $q.reject('Erro ao fazer login');
      });
  };

  // Verificar se o login já existe
  service.verificarLogin = function(login) {
    return $http.get(baseUrl + '/verificar-login?login=' + login)
      .then(function(response) {
        return response.data;
      });
  };

  // Realizar registro de novo usuário
  service.registrar = function(usuario) {
    return $http.post(baseUrl + '/register', usuario)
      .then(function(response) {
        if (response.data && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('usuario', JSON.stringify({
            id: response.data.id,
            nome: response.data.nome,
            login: response.data.login,
            saldo: response.data.saldo,
            admin: response.data.admin
          }));
          return response.data;
        }
        return $q.reject('Erro ao registrar');
      });
  };

  // Realizar logout
  service.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  // Verificar autenticação (para uso em resolves)
  service.verificarAutenticacao = function() {
    var deferred = $q.defer();

    if (service.isAutenticado()) {
      deferred.resolve(true);
    } else {
      deferred.reject('Não autenticado');
      $location.path('/login');
    }

    return deferred.promise;
  };

  return service;
}]);
