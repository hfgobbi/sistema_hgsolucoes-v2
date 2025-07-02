// Controller de registro
app.controller('RegisterController', ['$scope', 'authService', '$location', function($scope, authService, $location) {
  var vm = this;
  
  // Modelo para os dados de registro
  vm.usuario = {
    nome: '',
    login: '',
    senha: '',
    data_nascimento: null
  };
  
  // Confirmação de senha
  vm.confirmacaoSenha = '';
  
  // Mensagem de erro
  vm.erro = '';
  
  // Verificar se já está logado
  if (authService.isAutenticado()) {
    $location.path('/');
  }
  
  // Verificar disponibilidade do login
  vm.verificarLogin = function() {
    if (vm.usuario.login && vm.usuario.login.length >= 5) {
      authService.verificarLogin(vm.usuario.login)
        .then(function(response) {
          vm.loginDisponivel = response.disponivel;
        })
        .catch(function() {
          vm.loginDisponivel = null;
        });
    } else {
      vm.loginDisponivel = null;
    }
  };
  
  // Função para realizar o registro
  vm.registrar = function() {
    // Validar dados
    if (!vm.usuario.nome || !vm.usuario.login || !vm.usuario.senha || !vm.usuario.data_nascimento) {
      vm.erro = 'Preencha todos os campos';
      return;
    }
    
    if (vm.usuario.nome.length < 5) {
      vm.erro = 'Nome deve ter pelo menos 5 caracteres';
      return;
    }
    
    if (vm.usuario.login.length < 5) {
      vm.erro = 'Login deve ter pelo menos 5 caracteres';
      return;
    }
    
    if (vm.usuario.senha.length < 6) {
      vm.erro = 'Senha deve ter pelo menos 6 caracteres';
      return;
    }
    
    if (vm.usuario.senha !== vm.confirmacaoSenha) {
      vm.erro = 'As senhas não conferem';
      return;
    }
    
    // Limpar mensagem de erro
    vm.erro = '';
    
    // Chamar o serviço de autenticação
    authService.registrar(vm.usuario)
      .then(function(response) {
        $location.path('/');
      })
      .catch(function(erro) {
        vm.erro = 'Erro ao registrar: ' + (erro || 'Verifique os dados e tente novamente');
      });
  };
  
  // Ir para a página de login
  vm.irParaLogin = function() {
    $location.path('/login');
  };
}]);
