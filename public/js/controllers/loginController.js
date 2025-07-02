// Controller de login
app.controller('LoginController', ['$scope', 'authService', '$location', function($scope, authService, $location) {
  var vm = this;
  
  // Modelo para os dados de login
  vm.credenciais = {
    login: '',
    senha: ''
  };
  
  // Mensagem de erro
  vm.erro = '';
  
  // Verificar se já está logado
  if (authService.isAutenticado()) {
    $location.path('/');
  }
  
  // Função para realizar o login
  vm.login = function() {
    if (!vm.credenciais.login || !vm.credenciais.senha) {
      vm.erro = 'Preencha todos os campos';
      return;
    }
    
    // Limpar mensagem de erro
    vm.erro = '';
    
    // Chamar o serviço de autenticação
    authService.login(vm.credenciais)
      .then(function(usuario) {
        $location.path('/');
      })
      .catch(function(erro) {
        vm.erro = 'Login ou senha incorretos';
      });
  };
  
  // Ir para a página de registro
  vm.irParaRegistro = function() {
    $location.path('/register');
  };
}]);
