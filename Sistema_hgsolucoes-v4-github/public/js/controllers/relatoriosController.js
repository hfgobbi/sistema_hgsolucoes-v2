/**
 * Controller AngularJS para relatórios avançados
 */
app.controller('RelatoriosController', function($scope, $http, toastr, $timeout) {
  
  // Inicialização
  $scope.relatorios = {
    fluxoCaixa: {
      dados: null,
      ano: new Date().getFullYear()
    },
    gastosPorCategoria: {
      dados: null,
      mes: new Date().getMonth() + 1,
      ano: new Date().getFullYear()
    },
    evolucaoPatrimonial: {
      dados: null,
      periodo: 12
    }
  };
  
  // Exportação
  $scope.exportacao = {
    filtros: {
      dataInicio: '',
      dataFim: '',
      tipo: ''
    }
  };
  
  // Lista de anos para seleção
  $scope.anos = [];
  const anoAtual = new Date().getFullYear();
  for (let i = anoAtual - 5; i <= anoAtual + 1; i++) {
    $scope.anos.push(i);
  }
  
  // Lista de meses para seleção
  $scope.meses = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ];
  
  // Períodos para evolução patrimonial
  $scope.periodos = [
    { valor: 3, nome: '3 meses' },
    { valor: 6, nome: '6 meses' },
    { valor: 12, nome: '12 meses' },
    { valor: 24, nome: '24 meses' }
  ];
  
  /**
   * Carrega o relatório de fluxo de caixa
   */
  $scope.carregarFluxoCaixa = function() {
    $scope.carregandoFluxo = true;
    
    $http.get(`/api/relatorios/fluxo-caixa?ano=${$scope.relatorios.fluxoCaixa.ano}`)
      .then(function(response) {
        $scope.relatorios.fluxoCaixa.dados = response.data;
        
        // Preparar dados para o gráfico
        setTimeout(function() {
          gerarGraficoFluxoCaixa(response.data);
        }, 100);
      })
      .catch(function(error) {
        console.error(error);
        toastr.error('Erro ao carregar relatório de fluxo de caixa');
      })
      .finally(function() {
        $scope.carregandoFluxo = false;
      });
  };
  
  /**
   * Carrega o relatório de gastos por categoria
   */
  $scope.carregarGastosPorCategoria = function() {
    $scope.carregandoGastos = true;
    
    const mes = $scope.relatorios.gastosPorCategoria.mes;
    const ano = $scope.relatorios.gastosPorCategoria.ano;
    
    $http.get(`/api/relatorios/gastos-categoria?mes=${mes}&ano=${ano}`)
      .then(function(response) {
        $scope.relatorios.gastosPorCategoria.dados = response.data;
        
        // Preparar dados para o gráfico
        setTimeout(function() {
          gerarGraficoGastosPorCategoria(response.data);
        }, 100);
      })
      .catch(function(error) {
        console.error(error);
        toastr.error('Erro ao carregar relatório de gastos por categoria');
      })
      .finally(function() {
        $scope.carregandoGastos = false;
      });
  };
  
  /**
   * Carrega o relatório de evolução patrimonial
   */
  $scope.carregarEvolucaoPatrimonial = function() {
    $scope.carregandoEvolucao = true;
    
    $http.get(`/api/relatorios/evolucao-patrimonial?periodo=${$scope.relatorios.evolucaoPatrimonial.periodo}`)
      .then(function(response) {
        $scope.relatorios.evolucaoPatrimonial.dados = response.data;
        
        // Preparar dados para o gráfico
        setTimeout(function() {
          gerarGraficoEvolucaoPatrimonial(response.data);
        }, 100);
      })
      .catch(function(error) {
        console.error(error);
        toastr.error('Erro ao carregar relatório de evolução patrimonial');
      })
      .finally(function() {
        $scope.carregandoEvolucao = false;
      });
  };
  
  /**
   * Exportação de dados para CSV
   */
  $scope.exportarCSV = function() {
    const params = new URLSearchParams();
    
    if ($scope.exportacao.filtros.dataInicio) {
      params.append('dataInicio', $scope.exportacao.filtros.dataInicio);
    }
    
    if ($scope.exportacao.filtros.dataFim) {
      params.append('dataFim', $scope.exportacao.filtros.dataFim);
    }
    
    if ($scope.exportacao.filtros.tipo) {
      params.append('tipo', $scope.exportacao.filtros.tipo);
    }
    
    // Redirect para download (não pode ser feito via AJAX)
    window.location.href = `/api/export/csv?${params.toString()}`;
  };
  
  /**
   * Exportação de dados para JSON
   */
  $scope.exportarJSON = function() {
    const params = new URLSearchParams();
    
    if ($scope.exportacao.filtros.dataInicio) {
      params.append('dataInicio', $scope.exportacao.filtros.dataInicio);
    }
    
    if ($scope.exportacao.filtros.dataFim) {
      params.append('dataFim', $scope.exportacao.filtros.dataFim);
    }
    
    if ($scope.exportacao.filtros.tipo) {
      params.append('tipo', $scope.exportacao.filtros.tipo);
    }
    
    // Redirect para download (não pode ser feito via AJAX)
    window.location.href = `/api/export/json?${params.toString()}`;
  };
  
  /**
   * Gera o gráfico de fluxo de caixa
   */
  function gerarGraficoFluxoCaixa(dados) {
    const ctx = document.getElementById('graficoFluxoCaixa');
    if (!ctx) return;
    
    if (window.graficoFluxoCaixa) {
      window.graficoFluxoCaixa.destroy();
    }
    
    const labels = dados.meses.map(m => m.nome.substring(0, 3));
    const datasetsReceitas = dados.meses.map(m => m.receitas);
    const datasetsDespesas = dados.meses.map(m => m.despesas);
    const datasetsSaldo = dados.meses.map(m => m.saldo);
    
    window.graficoFluxoCaixa = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Receitas',
            data: datasetsReceitas,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Despesas',
            data: datasetsDespesas,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          },
          {
            label: 'Saldo',
            data: datasetsSaldo,
            type: 'line',
            fill: false,
            borderColor: 'rgba(54, 162, 235, 1)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  
  /**
   * Gera o gráfico de gastos por categoria
   */
  function gerarGraficoGastosPorCategoria(dados) {
    const ctx = document.getElementById('graficoGastosPorCategoria');
    if (!ctx) return;
    
    if (window.graficoGastosPorCategoria) {
      window.graficoGastosPorCategoria.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = dados.categorias.map(c => c.descricao);
    const datasetsValores = dados.categorias.map(c => c.total);
    
    // Gerar cores aleatórias
    const cores = [];
    for (let i = 0; i < labels.length; i++) {
      cores.push(gerarCorAleatoria());
    }
    
    window.graficoGastosPorCategoria = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: datasetsValores,
          backgroundColor: cores,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true
      }
    });
  }
  
  /**
   * Gera o gráfico de evolução patrimonial
   */
  function gerarGraficoEvolucaoPatrimonial(dados) {
    const ctx = document.getElementById('graficoEvolucaoPatrimonial');
    if (!ctx) return;
    
    if (window.graficoEvolucaoPatrimonial) {
      window.graficoEvolucaoPatrimonial.destroy();
    }
    
    // Preparar dados para o gráfico
    const labels = dados.evolucao.map(e => e.referencia);
    const datasetsValores = dados.evolucao.map(e => e.patrimonio);
    
    window.graficoEvolucaoPatrimonial = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Patrimônio',
          data: datasetsValores,
          fill: true,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false
          }
        }
      }
    });
  }
  
  /**
   * Gera uma cor aleatória para os gráficos
   */
  function gerarCorAleatoria() {
    const r = Math.floor(Math.random() * 200) + 55;
    const g = Math.floor(Math.random() * 200) + 55;
    const b = Math.floor(Math.random() * 200) + 55;
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  }
  
  // Carregar relatórios iniciais
  $scope.carregarFluxoCaixa();
});
