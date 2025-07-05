// Arquivo de teste para debug do dashboard
console.log("====== DIAGNÓSTICO DO DASHBOARD ======");

// Inserir um JavaScript que será injetado na página para fazer o diagnóstico
const scriptDebug = `
  console.log("INICIANDO DIAGNÓSTICO DE MÉDIAS");
  
  // Verificar se o objeto dashboard existe
  if (typeof angular !== 'undefined') {
    console.log("Angular encontrado");
    
    // Capturar o $scope do dashboardController
    var elemento = document.querySelector('[ng-controller="dashboardController"]');
    if (elemento) {
      console.log("Elemento do controller encontrado");
      var $scope = angular.element(elemento).scope();
      
      if ($scope) {
        console.log("$scope capturado:");
        console.log("- dashboard existe:", !!$scope.dashboard);
        
        if ($scope.dashboard) {
          console.log("- tendencias existe:", !!$scope.dashboard.tendencias);
          
          if ($scope.dashboard.tendencias) {
            console.log("- medias existe:", !!$scope.dashboard.tendencias.medias);
            console.log("- valores_atuais existe:", !!$scope.dashboard.tendencias.valores_atuais);
            
            if ($scope.dashboard.tendencias.medias) {
              console.log("VALORES DAS MÉDIAS:");
              console.log("- receitas:", $scope.dashboard.tendencias.medias.receitas);
              console.log("- despesas:", $scope.dashboard.tendencias.medias.despesas);
              console.log("- saldo:", $scope.dashboard.tendencias.medias.saldo);
            }
          }
        }
      } else {
        console.log("$scope não encontrado");
      }
    } else {
      console.log("Elemento do controller NÃO encontrado");
    }
  } else {
    console.log("Angular NÃO encontrado");
  }
`;

console.log("Script de diagnóstico criado. Execute no console do navegador.");
