// Módulo principal da aplicação
console.log('Iniciando aplicação Angular...');

// Verifique se ngMask está disponível antes de usá-lo
var dependencies = ['ngRoute', 'chart.js', 'ngMaterial'];

// Carregue condicionalmente o ngMask se disponível
try {
  angular.module('ngMask');
  dependencies.push('ngMask');
  console.log('ngMask carregado com sucesso');
} catch (e) {
  console.warn('Módulo ngMask não disponível, continuando sem ele');
}

var app = angular.module('financeApp', dependencies);

app.run(function($rootScope) {
  console.log('Aplicação Angular iniciada');
  
  $rootScope.isLogado = function() {
    return !!localStorage.getItem('token');
  };
});

// Diretiva para converter valores de string para número
app.directive('convertToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return parseInt(val, 10);
      });
      ngModel.$formatters.push(function(val) {
        return '' + val;
      });
    }
  };
});

// Configuração das rotas
app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider
    // Rota para a página inicial (dashboard aprimorado)
    .when('/', {
      templateUrl: 'views/dashboard.html',
      controller: 'DashboardController',
      resolve: {
        autenticado: ['authService', function(authService) {
          return authService.verificarAutenticacao();
        }]
      }
    })
    
    // Rota para login
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'LoginController',
      controllerAs: 'vm'
    })
    
    // Rota para registro
    .when('/register', {
      templateUrl: 'views/register.html',
      controller: 'RegisterController',
      controllerAs: 'vm'
    })
    
    // Rota para listagem de movimentações
    .when('/movimentacoes', {
      templateUrl: 'views/movimentacoesList.html',
      controller: 'MovimentacoesListController',
      controllerAs: 'vm',
      resolve: {
        autenticado: ['authService', function(authService) {
          return authService.verificarAutenticacao();
        }]
      }
    })
    
    // Rota para cadastro/edição de movimentações
    .when('/movimentacoes/:id?', {
      templateUrl: 'views/movimentacoesCad.html',
      controller: 'MovimentacoesCadController',
      controllerAs: 'vm',
      resolve: {
        autenticado: ['authService', function(authService) {
          return authService.verificarAutenticacao();
        }]
      }
    })
    
    // Rota para gerenciamento de categorias
    .when('/categorias', {
      templateUrl: 'views/categorias.html',
      controller: 'CategoriaController',
      controllerAs: 'vm',
      resolve: {
        autenticado: ['authService', function(authService) {
          return authService.verificarAutenticacao();
        }]
      }
    })
    
    // Rota para relatórios financeiros avançados
    .when('/relatorios', {
      templateUrl: 'views/relatorios.html',
      controller: 'RelatoriosController',
      resolve: {
        autenticado: ['authService', function(authService) {
          return authService.verificarAutenticacao();
        }]
      }
    })
    
    // Rota para página antiga (mantida para compatibilidade)
    .when('/home-old', {
      templateUrl: 'views/home.html',
      controller: 'HomeController',
      resolve: {
        autenticado: ['authService', function(authService) {
          return authService.verificarAutenticacao();
        }]
      }
    })
    
    // Rota para página não encontrada
    .otherwise({
      redirectTo: '/home'
    });
}]);

// Interceptor para adicionar token de autenticação em todas as requisições
app.factory('authInterceptor', ['$q', '$window', function($q, $window) {
  return {
    request: function(config) {
      config.headers = config.headers || {};
      var token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = 'Bearer ' + token;
      }
      return config;
    },
    responseError: function(rejection) {
      if (rejection.status === 401) {
        // Redirecionar para login se o token estiver expirado ou inválido
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        $window.location.href = '/#/login';
      }
      return $q.reject(rejection);
    }
  };
}]);

// Adicionar o interceptor às requisições HTTP
app.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
}]);

// Função para verificar se o usuário está logado
app.run(['$rootScope', 'authService', '$location', '$window',
  function($rootScope, authService, $location, $window) {
    // Correção para o erro 'Error during captureScrollEvent'
    $rootScope.safeScrollEvent = function(event) {
      try {
        // Evita erros de scroll em páginas não inicializadas
        if (!event || !event.target) return;
      } catch (e) {
        console.warn('Erro de captura de evento de scroll evitado');
      }
    };
    
    // Aplica o handler de scroll seguro para evitar erros
    angular.element($window).on('scroll', $rootScope.safeScrollEvent);
    // Verificar e inicializar o tema salvo
    $rootScope.temaEscuroAtivo = localStorage.getItem('temaEscuro') === 'true';
    
    // Aplicar tema ao carregar
    if ($rootScope.temaEscuroAtivo) {
      document.body.classList.add('tema-escuro');
    } else {
      document.body.classList.remove('tema-escuro');
    }
    
    // Função para alternar entre tema claro e escuro
    $rootScope.alternarTema = function() {
      $rootScope.temaEscuroAtivo = !$rootScope.temaEscuroAtivo;
      
      if ($rootScope.temaEscuroAtivo) {
        document.body.classList.add('tema-escuro');
      } else {
        document.body.classList.remove('tema-escuro');
      }
      
      // Salvar preferência no localStorage
      localStorage.setItem('temaEscuro', $rootScope.temaEscuroAtivo);
    };
    $rootScope.isLogado = function() {
      return authService.isAutenticado();
    };
    
    $rootScope.usuario = function() {
      return authService.getUsuario();
    };
    
    $rootScope.logout = function() {
      authService.logout();
      $location.path('/login');
    };
    
        // Navegação para login se não estiver autenticado
    $rootScope.$on('$routeChangeStart', function(event, nextRoute) {
      console.log('Rota alterando para:', nextRoute);
      
      // Se não tem rota definida ou não é rota de login/registro e não está autenticado
      if (!nextRoute || !nextRoute.$$route) {
        console.log('Rota indefinida detectada');
        return;
      }
      
      var path = nextRoute.$$route.originalPath;
      console.log('Caminho da rota:', path);
      
      // Se não está autenticado e não está tentando acessar login/register
      if (!authService.isAutenticado() && 
          path !== '/login' && 
          path !== '/register') {
        console.log('Usuário não autenticado - redirecionando para login');
        event.preventDefault();
        $location.path('/login');
      }
    });
  }
]);
