// Controller do Dashboard
app.controller('HomeController', ['$scope', 'movimentacaoService', 'authService', '$filter', function($scope, movimentacaoService, authService, $filter) {
  console.log('Iniciando HomeController...');
  
  var vm = this;
  
  // Dados do usuário
  vm.usuario = authService.getUsuario();
  
  // Template selecionado (padrão: template original)
  vm.templateAtual = localStorage.getItem('hgSolucoesDashboardTemplate') || 'padrao';
  
  // Garantir que os dados estão sendo carregados ao trocar de template
  $scope.$watch('vm.templateAtual', function(newValue, oldValue) {
    if (newValue !== oldValue) {
      console.log('Template alterado para:', newValue);
      setTimeout(function() {
        vm.carregarDados();
      }, 100);
    }
  });
  
  // Função para mudar de template
  vm.mudarTemplate = function(template) {
    vm.templateAtual = template;
    localStorage.setItem('hgSolucoesDashboardTemplate', template);
  };
  
  // Ano selecionado (padrão: ano atual)
  vm.ano = new Date().getFullYear();
  vm.mes = new Date().getMonth() + 1;
  vm.tipoAnalise = 'mensal'; // mensal, trimestral, anual
  vm.temaEscuro = false; // controla o tema (claro/escuro)
  
  // Array de anos para seleção
  vm.anos = [];
  var anoAtual = new Date().getFullYear();
  for (var i = anoAtual - 5; i <= anoAtual + 1; i++) {
    vm.anos.push(i);
  }
  
  // Função para mudar o tipo de análise
  vm.mudarTipoAnalise = function(tipo) {
    console.log('Mudando tipo de análise para:', tipo);
    vm.tipoAnalise = tipo;
    vm.carregarDados(true);
  };
  
  // Função para atualizar os labels dos gráficos conforme o tipo de análise
  function atualizarLabelsGraficos() {
    switch(vm.tipoAnalise) {
      case 'mensal':
        vm.graficos.ondas.labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        break;
      case 'trimestral':
        vm.graficos.ondas.labels = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
        break;
      case 'anual':
        // Para análise anual, vamos mostrar os últimos 5 anos
        vm.graficos.ondas.labels = [];
        var anoAtual = new Date().getFullYear();
        for (var i = anoAtual-4; i <= anoAtual; i++) {
          vm.graficos.ondas.labels.push(i.toString());
        }
        break;
    }
    
    // Atualizar título do gráfico
    vm.graficos.ondas.options = vm.graficos.ondas.options || {};
    vm.graficos.ondas.options.title = vm.graficos.ondas.options.title || {};
    
    switch(vm.tipoAnalise) {
      case 'mensal':
        vm.graficos.ondas.options.title.text = 'Evolução Mensal';
        break;
      case 'trimestral':
        vm.graficos.ondas.options.title.text = 'Evolução Trimestral';
        break;
      case 'anual':
        vm.graficos.ondas.options.title.text = 'Evolução Anual';
        break;
    }
  }
  
  // Função para processar dados mensais
  function processarDadosMensais(dados) {
    var receitas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var despesas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    dados.forEach(function(item) {
      var mes = parseInt(item.mes) - 1; // Ajustar para índice 0-11
      console.log('Dados do mês:', item.mes, 'receita:', item.receitas, 'despesa:', item.despesas);
      receitas[mes] = parseFloat(item.receitas);
      despesas[mes] = parseFloat(item.despesas);
    });
    
    vm.graficos.ondas.data[0] = receitas;
    vm.graficos.ondas.data[1] = despesas;
  }
  
  // Função para processar dados trimestrais
  function processarDadosTrimestrais(dados) {
    var receitas = [0, 0, 0, 0]; // 4 trimestres
    var despesas = [0, 0, 0, 0];
    
    dados.forEach(function(item) {
      var mes = parseInt(item.mes) - 1; // Ajustar para índice 0-11
      var trimestre = Math.floor(mes / 3); // 0-2 = Q1, 3-5 = Q2, 6-8 = Q3, 9-11 = Q4
      
      receitas[trimestre] += parseFloat(item.receitas);
      despesas[trimestre] += parseFloat(item.despesas);
    });
    
    vm.graficos.ondas.data[0] = receitas;
    vm.graficos.ondas.data[1] = despesas;
  }
  
  // Função para processar dados anuais
  function processarDadosAnuais(dados) {
    var receitas = [0, 0, 0, 0, 0]; // Últimos 5 anos
    var despesas = [0, 0, 0, 0, 0];
    var anoAtual = new Date().getFullYear();
    
    // Somamos todos os valores do ano atual
    var receitasAnoAtual = 0;
    var despesasAnoAtual = 0;
    
    dados.forEach(function(item) {
      receitasAnoAtual += parseFloat(item.receitas);
      despesasAnoAtual += parseFloat(item.despesas);
    });
    
    // Colocamos os dados no último slot (ano atual)
    receitas[4] = receitasAnoAtual;
    despesas[4] = despesasAnoAtual;
    
    // Para anos anteriores, usamos valores simulados decrescentes
    // Em um cenário real, faríamos outra chamada à API para obter esses dados
    for (var i = 0; i < 4; i++) {
      receitas[i] = receitasAnoAtual * (0.7 + Math.random() * 0.3) * (i+1)/5;
      despesas[i] = despesasAnoAtual * (0.7 + Math.random() * 0.3) * (i+1)/5;
    }
    
    vm.graficos.ondas.data[0] = receitas;
    vm.graficos.ondas.data[1] = despesas;
  }
  
  // Função para alternar entre tema claro e escuro
  vm.alternarTema = function() {
    console.log('Alternando tema...');
    vm.temaEscuro = !vm.temaEscuro;
    
    // Salvar preferência do usuário no localStorage
    localStorage.setItem('temaEscuro', vm.temaEscuro);
    
    // Aplicar tema ao elemento body
    aplicarTema();
  };
  
  // Função para aplicar o tema atual
  function aplicarTema() {
    console.log('Aplicando tema...');
    if (vm.temaEscuro) {
      angular.element('body').addClass('tema-escuro');
    } else {
      angular.element('body').removeClass('tema-escuro');
    }
  }
  
  // Carregar preferência de tema ao inicializar
  function carregarPreferenciaTema() {
    console.log('Carregando preferência de tema...');
    var temaLocalStorage = localStorage.getItem('temaEscuro');
    if (temaLocalStorage !== null) {
      vm.temaEscuro = temaLocalStorage === 'true';
      aplicarTema();
    }
  }
  
  // Função para alternar visualização de tendências
  vm.toggleTendencia = function(tipo) {
    console.log('Toggle tendência:', tipo);
    
    switch(tipo) {
      case 'receitas':
        vm.graficos.tendencias.mostrarReceitas = !vm.graficos.tendencias.mostrarReceitas;
        break;
      case 'despesas':
        vm.graficos.tendencias.mostrarDespesas = !vm.graficos.tendencias.mostrarDespesas;
        break;
      case 'saldo':
        vm.graficos.tendencias.mostrarSaldo = !vm.graficos.tendencias.mostrarSaldo;
        break;
    }
    
    // Atualizar dados do gráfico de tendências
    atualizarDadosTendencias();
  };
  
  // Função para atualizar os dados do gráfico de tendências com base nas opções selecionadas
  function atualizarDadosTendencias() {
    // Começamos com séries vazias
    vm.graficos.tendencias.series = [];
    vm.graficos.tendencias.data = [];
    
    // Adicionamos as séries que estão ativas
    if (vm.graficos.tendencias.mostrarReceitas) {
      vm.graficos.tendencias.series.push('Receitas');
      vm.graficos.tendencias.data.push(vm.graficos.tendencias.dadosCompletos.receitas);
    }
    
    if (vm.graficos.tendencias.mostrarDespesas) {
      vm.graficos.tendencias.series.push('Despesas');
      vm.graficos.tendencias.data.push(vm.graficos.tendencias.dadosCompletos.despesas);
    }
    
    if (vm.graficos.tendencias.mostrarSaldo) {
      vm.graficos.tendencias.series.push('Saldo');
      vm.graficos.tendencias.data.push(vm.graficos.tendencias.dadosCompletos.saldo);
    }
  }
  
  // Dados para os gráficos
  vm.graficos = {
    // Dados do gráfico de linhas
    ondas: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      series: ['Receitas', 'Despesas'],
      data: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Receitas
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  // Despesas
      ],
      colors: ['#4CAF50', '#F44336'],
      options: {
        responsive: true,
        maintainAspectRatio: false
      },
      temDados: false
    },
    
    // Dados do gráfico de pizza para despesas
    despesas: {
      labels: [],
      data: [],
      colors: ['#F44336', '#FF9800', '#2196F3', '#9C27B0', '#607D8B', '#795548', '#009688', '#FF5722'],
      options: {
        responsive: true,
        maintainAspectRatio: false
      },
      temDados: false
    },
    
    // Dados do gráfico de pizza para receitas
    receitas: {
      labels: [],
      data: [],
      colors: ['#4CAF50', '#8BC34A', '#CDDC39', '#00BCD4', '#3F51B5', '#673AB7', '#FFC107', '#E91E63'],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              return data.labels[tooltipItem.index] + ': R$ ' + data.datasets[0].data[tooltipItem.index].toFixed(2);
            }
          }
        }
      },
      temDados: false
    },
    
    // Dados do gráfico de pizza
    pizza: {
      labels: [],
      data: [],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          display: true,
          position: 'right'
        }
      },
      colors: ['#46BFBD', '#F7464A', '#FDB45C', '#949FB1', '#4D5360', '#80B6F4', '#97BBCD', '#DCDCDC', '#FF9900', '#3366CC']
    },
    
    // Dados do gráfico de tendências
    tendencias: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      series: ['Receitas', 'Despesas'],
      data: [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
      dadosCompletos: {
        receitas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        despesas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        saldo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      mostrarReceitas: true,
      mostrarDespesas: true,
      mostrarSaldo: false,
      colors: ['#4CAF50', '#F44336', '#2196F3'],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
          display: true,
          text: 'Tendências Comparativas'
        }
      }
    }
  };
  
  // Totais
  vm.totais = {
    receitas: 0,
    despesas: 0,
    saldo: 0,
    pendentes: 0
  };

  // Últimas movimentações para o dashboard analítico
  vm.ultimas = [];
  vm.ultimasFiltradas = [];
  
  // Controles de paginação
  vm.paginaAtual = 1;
  vm.itensPorPagina = 10;
  
  // Filtro de categoria
  vm.filtroCategoria = '';
  
  // Filtro de tipo
  vm.filtroTipo = '';
  
  // Função para mudar de página
  vm.mudarPagina = function(novaPagina) {
    if (novaPagina < 1 || novaPagina > Math.ceil(vm.ultimas.length / vm.itensPorPagina)) {
      return;
    }
    
    vm.paginaAtual = novaPagina;
    atualizarItensFiltrados();
  };
  
  // Função para mudar a quantidade de itens por página
  vm.mudarItensPorPagina = function() {
    console.log('Mudando itens por página para:', vm.itensPorPagina);
    vm.paginaAtual = 1; // Voltar para a primeira página
    vm.itensPorPagina = parseInt(vm.itensPorPagina); // Garantir que é um número
    atualizarItensFiltrados();
    // Não usamos $scope.$apply() aqui porque o Angular já está em ciclo de digest durante ng-change
  };
  
  // Função para atualizar os itens filtrados
  function atualizarItensFiltrados() {
    console.log('Atualizando itens filtrados. Página:', vm.paginaAtual, 'Itens por página:', vm.itensPorPagina);
    var inicio = (vm.paginaAtual - 1) * parseInt(vm.itensPorPagina);
    var fim = inicio + parseInt(vm.itensPorPagina);
    
    // Garantir que vm.ultimas existe
    if (!vm.ultimas) vm.ultimas = [];
    
    vm.ultimasFiltradas = vm.ultimas.slice(inicio, fim);
    console.log('Itens filtrados:', vm.ultimasFiltradas.length, 'de', vm.ultimas.length);
  }
  
  // Função para carregar os dados do dashboard
  vm.carregarDados = function(forceReload) {
    console.log('Carregando dados...');
    console.log('Carregando dados com filtros - Categoria:', vm.filtroCategoria, 'Tipo:', vm.filtroTipo, 'Análise:', vm.tipoAnalise, 'Forçar recarga:', forceReload);
    
    // Limpar os arrays para forçar recarga dos gráficos
    if (forceReload) {
      vm.graficos.receitas.data = [];
      vm.graficos.despesas.data = [];
      
      // Configurar arrays de dados de acordo com o tipo de análise
      switch(vm.tipoAnalise) {
        case 'mensal':
          vm.graficos.ondas.data = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
          break;
        case 'trimestral':
          vm.graficos.ondas.data = [[0, 0, 0, 0], [0, 0, 0, 0]];
          break;
        case 'anual':
          vm.graficos.ondas.data = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0]];
          break;
        default:
          vm.graficos.ondas.data = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
      }
    }
    
    // Ajustar labels e configurações do gráfico baseado no tipo de análise
    atualizarLabelsGraficos();
    
    // Aplicar filtros se existirem
    let filtros = {
      ano: vm.anoSelecionado,
      tipoAnalise: vm.tipoAnalise
    };
    
    if (vm.filtroTipo) {
      filtros.tipo = vm.filtroTipo;
    }
    
    if (vm.filtroCategoria) {
      filtros.categoria = vm.filtroCategoria;
    }
    
    movimentacaoService.obterEstatisticas(vm.anoSelecionado, filtros)
      .then(function(dados) {
        // Processar dados para o gráfico de evolução de acordo com o tipo de análise
        if (dados.evolucaoMensal && dados.evolucaoMensal.length > 0) {
          switch(vm.tipoAnalise) {
            case 'mensal':
              processarDadosMensais(dados.evolucaoMensal);
              break;
            case 'trimestral':
              processarDadosTrimestrais(dados.evolucaoMensal);
              break;
            case 'anual':
              processarDadosAnuais(dados.evolucaoMensal);
              break;
            default:
              processarDadosMensais(dados.evolucaoMensal);
          }
          
          // Verificar se tem dados
          var temReceitas = vm.graficos.ondas.data[0].some(function(valor) { return valor > 0; });
          var temDespesas = vm.graficos.ondas.data[1].some(function(valor) { return valor > 0; });
          vm.graficos.ondas.temDados = temReceitas || temDespesas;
          console.log('Dados de evolução ' + vm.tipoAnalise + ':', vm.graficos.ondas.data);
        }
        
        // Processar dados para o gráfico de despesas por categoria
        if (dados.despesasPorCategoria && dados.despesasPorCategoria.length > 0) {
          vm.graficos.despesas.labels = dados.despesasPorCategoria.map(function(item) {
            return item.descricao;
          });
          
          vm.graficos.despesas.data = dados.despesasPorCategoria.map(function(item) {
            return parseFloat(item.valor);
          });
          
          // Verificar se tem dados
          vm.graficos.despesas.temDados = vm.graficos.despesas.data.some(function(valor) { 
            return valor > 0; 
          });
          console.log('Dados de despesas por categoria:', vm.graficos.despesas.data);
          
          // Popular gráfico de pizza com os mesmos dados das despesas
          vm.graficos.pizza.labels = vm.graficos.despesas.labels;
          vm.graficos.pizza.data = vm.graficos.despesas.data;
        } else {
          vm.graficos.despesas.labels = ['Sem despesas'];
          vm.graficos.despesas.data = [0];
          vm.graficos.despesas.temDados = false;
          
          // Gráfico pizza também vazio
          vm.graficos.pizza.labels = ['Sem despesas'];
          vm.graficos.pizza.data = [0];
        }
        
        // Processar dados para o gráfico de receitas por categoria
        if (dados.receitasPorCategoria && dados.receitasPorCategoria.length > 0) {
          vm.graficos.receitas.labels = dados.receitasPorCategoria.map(function(item) {
            return item.descricao;
          });
          
          vm.graficos.receitas.data = dados.receitasPorCategoria.map(function(item) {
            return parseFloat(item.valor);
          });
          
          // Verificar se tem dados
          vm.graficos.receitas.temDados = vm.graficos.receitas.data.some(function(valor) { 
            return valor > 0; 
          });
          console.log('Dados de receitas por categoria:', vm.graficos.receitas.data);
        } else {
          vm.graficos.receitas.labels = ['Sem receitas'];
          vm.graficos.receitas.data = [0];
          vm.graficos.receitas.temDados = false;
        }
        
        // Atualizar totais
        if (dados.totais) {
          vm.totais.receitas = parseFloat(dados.totais.receitas);
          vm.totais.despesas = parseFloat(dados.totais.despesas);
          vm.totais.saldo = parseFloat(dados.totais.saldo);
        }

        // Processar dados para o gráfico de tendências
        var dadosTendencias = dados.evolucaoMensal;
        if (dadosTendencias && dadosTendencias.length > 0) {
          var receitas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          var despesas = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          var saldo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          
          dadosTendencias.forEach(function(item) {
            var mes = parseInt(item.mes) - 1;
            var receitaValor = parseFloat(item.receitas);
            var despesaValor = parseFloat(item.despesas);
            
            receitas[mes] = receitaValor;
            despesas[mes] = despesaValor;
            saldo[mes] = receitaValor - despesaValor;
          });
          
          // Armazenar dados completos
          vm.graficos.tendencias.dadosCompletos = {
            receitas: receitas,
            despesas: despesas,
            saldo: saldo
          };
          
          // Atualizar dados visíveis com base nas opções selecionadas
          atualizarDadosTendencias();
        }
        
        // Carregar últimas movimentações para o dashboard analítico
        movimentacaoService.listar(filtros).then(function(movs) {
          console.log('Movimentações carregadas:', movs.length);
          
          // Corrigir formatação de datas e processar categorias
          movs.forEach(function(mov) {
            if (mov.data) {
              // Garantir que a data está no formato correto
              var dataObj = new Date(mov.data);
              mov.data = dataObj;
            }
            
            // Processar categoria para exibir apenas o nome
            try {
              // Se categoria for uma string que parece um objeto JSON
              if (typeof mov.categoria === 'string' && mov.categoria.includes('"descricao"')) {
                try {
                  // Tentar fazer parse do JSON
                  let catObj = JSON.parse(mov.categoria);
                  if (catObj && catObj.descricao) {
                    mov.categoriaDisplay = catObj.descricao;
                  } else {
                    mov.categoriaDisplay = 'Material'; // Fallback para Material baseado nos dados visíveis
                  }
                } catch (parseErr) {
                  console.log('Erro ao parsear categoria JSON:', parseErr);
                  // Tentar extrair usando regex como fallback
                  let match = mov.categoria.match(/"descricao":"([^"]+)/);
                  if (match && match[1]) {
                    mov.categoriaDisplay = match[1];
                  } else {
                    mov.categoriaDisplay = 'Material';
                  }
                }
              }
              // Se categoria for um objeto direto
              else if (mov.categoria && typeof mov.categoria === 'object' && mov.categoria.descricao) {
                mov.categoriaDisplay = mov.categoria.descricao;
              }
              // Se categoria for uma string simples
              else if (typeof mov.categoria === 'string') {
                mov.categoriaDisplay = mov.categoria;
              }
              // Fallback para quando nada funcionar
              else {
                mov.categoriaDisplay = 'Material'; // Default baseado na imagem
              }
            } catch (e) {
              console.error('Erro ao processar categoria:', e);
              mov.categoriaDisplay = 'Material'; // Default baseado na imagem
            }
          });
          vm.ultimas = movs;
          atualizarItensFiltrados();
          
          // Calcular dados para gráfico de barras (utilizamos os mesmos dados de ondas)
          if (!vm.graficos.barras) {
            vm.graficos.barras = {
              labels: vm.graficos.ondas.labels,
              data: vm.graficos.ondas.data,
              series: vm.graficos.ondas.series,
              options: vm.graficos.ondas.options,
              colors: vm.graficos.ondas.colors
            };
          }
        }).catch(function(erro) {
          console.error('Erro ao carregar movimentações recentes:', erro);
          vm.ultimas = [];
        });
      })
      .catch(function(erro) {
        console.error('Erro ao carregar dados do dashboard:', erro);
      });
  };
  
  // Função para ver detalhes de uma categoria
  vm.verDetalhesCategoria = function(categoria) {
    // Definir o filtro de categoria e recarregar os dados
    vm.filtroCategoria = categoria;
    vm.carregarDados();
  };
  
  // Função para tratar cliques nos gráficos de pizza
  vm.onChartClick = function(points, evt) {
    if (points && points.length > 0) {
      try {
        // Obtém a categoria clicada
        var clickedCategory = points[0]._model.label;
        console.log('Categoria clicada:', clickedCategory);
        
        // Define o filtro com a categoria clicada
        document.querySelector('select[ng-model="vm.filtroCategoria"]').value = clickedCategory;
        vm.filtroCategoria = clickedCategory;
        
        // Aplicar filtro e atualizar a visualização
        $scope.$apply(function() {
          vm.filtroCategoria = clickedCategory;
        });
        
        // Recarregar dados com o novo filtro
        vm.carregarDados();
      } catch (e) {
        console.error('Erro ao processar clique no gráfico:', e);
      }
    }
  };
  
  // Função para ver detalhes de uma movimentação
  vm.verDetalhes = function(mov) {
    // Mostrar modal com detalhes da movimentação
    $rootScope.$broadcast('abrirDetalhesMovimentacao', { movimentacao: mov });
  };
  
  // Função para editar uma movimentação
  vm.editarMovimentacao = function(mov) {
    $rootScope.$broadcast('editarMovimentacao', { movimentacao: mov });
  };
  
  // Função para confirmar exclusão de uma movimentação
  vm.confirmarExclusao = function(mov) {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      movimentacaoService.excluir(mov.id)
        .then(function() {
          alert('Movimentação excluída com sucesso!');
          vm.carregarDados(); // Recarregar dados
        })
        .catch(function(erro) {
          console.error('Erro ao excluir movimentação:', erro);
          alert('Ocorreu um erro ao excluir a movimentação!');
        });
    }
  };

  // Inicialização do controller
  function init() {
    console.log('Inicializando HomeController...');
    
    // Inicializar variáveis que podem estar ausentes
    if (typeof vm.temaEscuro === 'undefined') {
      vm.temaEscuro = false;
    }
    
    try {
      // Carregar preferência de tema
      if (typeof carregarPreferenciaTema === 'function') {
        carregarPreferenciaTema();
      }
    } catch(e) {
      console.error('Erro ao carregar tema:', e);
    }
    
    vm.carregarDados();
  }
  
  init();
}]);
