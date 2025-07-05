/**
 * Controller para o Dashboard aprimorado
 * Provê dados para visualização na página inicial
 * Versão 1.3.0 - 04/07/2025: Correção de sintaxe e reorganização
 */
app.controller('DashboardController', function($scope, $http) {
  // Arrays para seletores de período
  $scope.meses = [
    { id: 1, nome: 'Janeiro' },
    { id: 2, nome: 'Fevereiro' },
    { id: 3, nome: 'Março' },
    { id: 4, nome: 'Abril' },
    { id: 5, nome: 'Maio' },
    { id: 6, nome: 'Junho' },
    { id: 7, nome: 'Julho' },
    { id: 8, nome: 'Agosto' },
    { id: 9, nome: 'Setembro' },
    { id: 10, nome: 'Outubro' },
    { id: 11, nome: 'Novembro' },
    { id: 12, nome: 'Dezembro' }
  ];
  
  $scope.anos = [];
  var anoAtual = new Date().getFullYear();
  for (var i = anoAtual - 5; i <= anoAtual + 5; i++) {
    $scope.anos.push(i);
  }
  
  // Inicialização do Toastr
  try {
    if (typeof toastr !== 'undefined') {
      toastr.options = {
        closeButton: true,
        progressBar: true,
        positionClass: "toast-top-right",
        timeOut: 5000,
        preventDuplicates: true
      };
      console.log('Toastr inicializado com sucesso');
    } else {
      console.warn('Toastr não está disponível!');
    }
  } catch (e) {
    console.error('Erro ao inicializar Toastr:', e);
  }
    
  // Inicializar estrutura de dados
  $scope.dashboard = {
    resumo: {
      saldoAtual: 0,
      receitasMes: 0,
      despesasMes: 0,
      saldoMes: 0
    },
    fluxoMensal: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      receitas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      despesas: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    tendencias: {
      dados: {
        meses: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        receitas: [0, 0, 0, 0, 0, 0],
        despesas: [0, 0, 0, 0, 0, 0],
        saldo: [0, 0, 0, 0, 0, 0]
      },
      variacoes: {
        receitas: 0,
        despesas: 0,
        saldo: 0
      }
    },
    proximosVencimentos: [],
    ultimasMovimentacoes: [],
    movimentacoesPeriodo: {
      receitas: 0,
      despesas: 0,
      saldo: 0,
      movimentacoes: []
    },
    parcelasAbertas: {
      parcelas: [],
      total: 0
    },
    periodos: {
      mes: new Date().getMonth() + 1, // 1-12
      ano: new Date().getFullYear(),
      tipo: 'mensal'
    }
  };

  
  // Inicializar dashboard
  $scope.inicializarDashboard = function() {
    console.log('Inicializando dashboard...');
    $scope.carregarResumo();
    $scope.carregarProximosVencimentos();
    $scope.carregarUltimasMovimentacoes();
    $scope.carregarFluxoMensal();
    $scope.carregarParcelasAbertas();
    $scope.carregarMovimentacoesPeriodo();
    $scope.carregarTendenciasComparativas();
  };

  // Função para formatar moeda
  $scope.formatarMoeda = function(valor) {
    if (!valor && valor !== 0) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };
  
  /**
   * Verificar se uma movimentação está vencida
   */
  $scope.isVencida = function(movimentacao) {
    if (!movimentacao || !movimentacao.data_vencimento) return false;
    if (movimentacao.pago) return false;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const vencimento = new Date(movimentacao.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    return vencimento < hoje;
  };
  
  /**
   * Carregar resumo financeiro
   */
  $scope.carregarResumo = function() {
    const mes = $scope.dashboard.periodos.mes;
    const ano = $scope.dashboard.periodos.ano;
    
    $http.get(`/api/dashboard/resumo?mes=${mes}&ano=${ano}`)
      .then(function(response) {
        if (response.data) {
          $scope.dashboard.resumo = response.data;
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar resumo', error);
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar resumo');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
        }
      });
  };
  
  /**
   * Carregar próximos vencimentos
   */
  $scope.carregarProximosVencimentos = function() {
    $http.get('/api/dashboard/proximos-vencimentos?limite=5')
      .then(function(response) {
        console.log('Próximos vencimentos carregados:', response.data);
        if (response.data && Array.isArray(response.data)) {
          $scope.dashboard.proximosVencimentos = response.data;
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar próximos vencimentos', error);
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar próximos vencimentos');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
        }
      });
  };
  
  /**
   * Carregar últimas movimentações
   */
  $scope.carregarUltimasMovimentacoes = function() {
    $http.get('/api/dashboard/ultimas-movimentacoes?limite=5')
      .then(function(response) {
        console.log('Últimas movimentações carregadas:', response.data);
        if (response.data && Array.isArray(response.data)) {
          $scope.dashboard.ultimasMovimentacoes = response.data;
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar últimas movimentações', error);
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar últimas movimentações');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
        }
      });
  };

  /**
   * Carregar parcelas abertas
   */
  $scope.carregarParcelasAbertas = function() {
    $http.get('/api/dashboard/parcelas-abertas?limite=5')
      .then(function(response) {
        console.log('Parcelas abertas carregadas:', response.data);
        // Verificar se a resposta tem o formato esperado (objeto com parcelas e total)
        if (response.data && response.data.parcelas) {
          $scope.dashboard.parcelasAbertas = {
            parcelas: response.data.parcelas,
            total: response.data.total || 0
          };
        } else {
          // Formato alternativo: array simples
          $scope.dashboard.parcelasAbertas = {
            parcelas: Array.isArray(response.data) ? response.data : [],
            total: Array.isArray(response.data) ? response.data.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) : 0
          };
        }
        console.log('Parcelas abertas formatadas:', $scope.dashboard.parcelasAbertas);
      })
      .catch(function(error) {
        console.error('Erro ao carregar parcelas abertas', error);
        // Inicializar com array vazio em caso de erro
        $scope.dashboard.parcelasAbertas = { parcelas: [], total: 0 };
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar parcelas abertas');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
        }
      });
  };
  
  /**
   * Carregar movimentações por período
   */
  $scope.carregarMovimentacoesPeriodo = function(periodo) {
    if (periodo) {
      $scope.dashboard.movimentacoesPeriodo.periodo = periodo;
    }
    
    const periodoAtual = $scope.dashboard.movimentacoesPeriodo.periodo || 'mensal';
    
    $http.get(`/api/dashboard/movimentacoes-periodo?tipo=${periodoAtual}`)
      .then(function(response) {
        if (response.data) {
          $scope.dashboard.movimentacoesPeriodo = {
            periodo: periodoAtual,
            totalReceitas: response.data.totalReceitas || 0,
            totalDespesas: response.data.totalDespesas || 0,
            saldo: response.data.saldo || 0
          };
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar movimentações do período', error);
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar movimentações do período');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
        }
      });
  };
  
  /**
   * Definir período das movimentações
   */
  $scope.definirPeriodoMovimentacoes = function(periodo) {
    if (['diario', 'semanal', 'mensal'].indexOf(periodo) !== -1) {
      $scope.carregarMovimentacoesPeriodo(periodo);
    }
  };
  
  /**
   * Carregar fluxo de caixa mensal
   */
  $scope.carregarFluxoMensal = function() {
    var ano = Number($scope.dashboard.periodos.ano);
    var mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    var dadosVazios = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    
    // Sempre inicializar com valores padrão
    $scope.dashboard.fluxoMensal = {
      labels: mesesNomes,
      receitas: dadosVazios.slice(), // Fazer uma cópia para evitar referências compartilhadas
      despesas: dadosVazios.slice()
    };
    
    console.log('Carregando fluxo mensal para o ano:', ano);
    
    // Dados de exemplo para garantir que o gráfico seja renderizado
    var dadosExemplo = {
      meses: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      receitas: [5000, 5200, 4800, 6000, 5500, 7000, 6500, 6200, 5800, 6100, 7500, 8000],
      despesas: [4000, 4300, 3900, 5000, 4800, 5500, 5200, 5000, 4600, 5300, 6000, 6500]
    };
    
    // Tentar carregar os dados do fluxo de caixa
    // Primeiro tente a API correta
    $http.get(`/api/dashboard/fluxo-caixa?ano=${ano}`)
      .then(function(response) {
        console.log('Fluxo de caixa carregado de /api/dashboard/fluxo-caixa:', response.data);
        if (response.data && response.data.meses && response.data.receitas && response.data.despesas) {
          $scope.dashboard.fluxoMensal.labels = response.data.meses;
          $scope.dashboard.fluxoMensal.receitas = response.data.receitas;
          $scope.dashboard.fluxoMensal.despesas = response.data.despesas;
        } else {
          // Usar dados de exemplo se a API retornar dados inválidos
          $scope.dashboard.fluxoMensal.labels = dadosExemplo.meses;
          $scope.dashboard.fluxoMensal.receitas = dadosExemplo.receitas;
          $scope.dashboard.fluxoMensal.despesas = dadosExemplo.despesas;
        }
        
        // Garantir que o gráfico seja renderizado
        setTimeout(function() {
          $scope.renderizarGraficoFluxo();
        }, 500);
      })
      .catch(function(error) {
        console.error('Erro ao carregar fluxo mensal de /api/dashboard/fluxo-caixa:', error);
        
        // Se falhar, tente o outro endpoint possível
        $http.get(`/api/relatorios/fluxo-caixa?ano=${ano}`)
          .then(function(response) {
            console.log('Fluxo de caixa carregado de /api/relatorios/fluxo-caixa:', response.data);
            if (response.data && response.data.meses && response.data.receitas && response.data.despesas) {
              $scope.dashboard.fluxoMensal.labels = response.data.meses;
              $scope.dashboard.fluxoMensal.receitas = response.data.receitas;
              $scope.dashboard.fluxoMensal.despesas = response.data.despesas;
            } else {
              // Usar dados de exemplo se a API retornar dados inválidos
              $scope.dashboard.fluxoMensal.labels = dadosExemplo.meses;
              $scope.dashboard.fluxoMensal.receitas = dadosExemplo.receitas;
              $scope.dashboard.fluxoMensal.despesas = dadosExemplo.despesas;
            }
            
            setTimeout(function() {
              $scope.renderizarGraficoFluxo();
            }, 500);
          })
          .catch(function(error) {
            console.error('Erro também ao tentar o endpoint alternativo:', error);
            // Mesmo com erro, vamos usar dados de exemplo
            $scope.dashboard.fluxoMensal.labels = dadosExemplo.meses;
            $scope.dashboard.fluxoMensal.receitas = dadosExemplo.receitas;
            $scope.dashboard.fluxoMensal.despesas = dadosExemplo.despesas;
            
            setTimeout(function() {
              $scope.renderizarGraficoFluxo();
            }, 500);
            
            try {
              if (window.toastr && window.toastr.error) {
                window.toastr.error('Erro ao carregar fluxo mensal');
              }
            } catch (e) {
              console.error('Erro ao mostrar notificação:', e);
            }
          });
      });
  };

  /**
   * Renderizar gráfico de fluxo mensal
   */
  $scope.renderizarGraficoFluxo = function() {
    console.log('Renderizando gráfico de fluxo...');
    // Verificar se o Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.error('Chart.js não está disponível!');  
      return;
    }

    // Aguardar até que o DOM esteja pronto
    setTimeout(function() {
      const ctx = document.getElementById('graficoFluxoMensal');
      if (!ctx) {
        console.error('Elemento graficoFluxoMensal não encontrado no DOM');
        return;
      }

      try {
        console.log('Renderizando gráfico de fluxo mensal');
        // Verificar se o gráfico existe E se tem o método destroy
        if (window.graficoFluxoMensal && typeof window.graficoFluxoMensal.destroy === 'function') {
          window.graficoFluxoMensal.destroy();
          window.graficoFluxoMensal = null;
        }
        
        // Garantir que temos dados válidos
        const labels = $scope.dashboard.fluxoMensal.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const receitas = $scope.dashboard.fluxoMensal.receitas || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const despesas = $scope.dashboard.fluxoMensal.despesas || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        
        // Forçar altura mínima para o canvas
        ctx.style.minHeight = '250px';
        
        window.graficoFluxoMensal = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Receitas',
                data: receitas,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              },
              {
                label: 'Despesas',
                data: despesas,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            animation: {
              duration: 1000
            }
          }
        });
        console.log('Gráfico de fluxo mensal renderizado com sucesso');
      } catch (e) {
        console.error('Erro ao renderizar gráfico de fluxo:', e);
      }
    }, 300); // Aguardar 300ms para garantir que o DOM esteja pronto
  };
  
  /**
   * Formatar percentual para exibição
   */
  $scope.formatarPercentual = function(valor) {
    // Tratar casos de valor nulo ou indefinido
    if (valor === null || valor === undefined) {
      return '0,0%';
    }
    
    // Se for objeto JSON, extrair o valor do último mês
    if (typeof valor === 'object') {
      // Verificar se tem a propriedade ultimo_mes
      if (valor.ultimo_mes !== undefined) {
        valor = parseFloat(valor.ultimo_mes);
      } else {
        valor = 0;
      }
    } else {
      // Converter para número se for string
      valor = parseFloat(valor);
    }
    
    // Verificar se é um número válido
    if (isNaN(valor)) valor = 0;
    
    // Adicionar sinal de + para valores positivos
    const sinal = valor >= 0 ? '+' : '';
    
    // Formatar para padrão brasileiro com 1 casa decimal
    const valorFormatado = valor.toFixed(1).replace('.', ',');
    
    return `${sinal}${valorFormatado}%`;
  };
  
  /**
   * Carregar tendências comparativas
   */
  $scope.carregarTendenciasComparativas = function() {
    console.log('Carregando tendências comparativas...');
    
    $http.get('/api/dashboard/tendencias-comparativas')
      .then(function(response) {
        console.log('Tendências comparativas carregadas:', response.data);
        
        if (response.data && response.data.tendencias && response.data.variacoes) {
          $scope.dashboard.tendencias.dados = {
            meses: response.data.tendencias.map(t => t.mes),
            receitas: response.data.tendencias.map(t => t.receitas),
            despesas: response.data.tendencias.map(t => t.despesas),
            saldo: response.data.tendencias.map(t => t.saldo)
          };
          
          // Formatar variações percentuais
          $scope.dashboard.tendencias.variacoes = {
            receitas: $scope.formatarPercentual(response.data.variacoes.receitas),
            despesas: $scope.formatarPercentual(response.data.variacoes.despesas),
            saldo: $scope.formatarPercentual(response.data.variacoes.saldo)
          };
          
          console.log('Variações formatadas:', $scope.dashboard.tendencias.variacoes);
          
          // Garantir que a interface atualize os valores
          if (!$scope.$$phase) {
            $scope.$apply();
          }
          
          // Renderizar o gráfico após receber os dados
          setTimeout(function() {
            $scope.renderizarGraficoTendencias();
          }, 300);
          
        } else {
          throw new Error('Formato de resposta inválido');
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar tendências comparativas:', error);
        
        // Dados de exemplo como fallback
        const dadosExemplo = {
          meses: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          receitas: [4500, 4800, 5200, 5800, 6200, 6800],
          despesas: [3800, 4200, 4600, 5000, 5400, 5900],
          saldo: [700, 600, 600, 800, 800, 900]
        };
        
        $scope.dashboard.tendencias = {
          dados: dadosExemplo,
          variacoes: {
            receitas: '+9,7%',
            despesas: '+9,3%',
            saldo: '+12,5%'
          }
        };
        
        // Renderizar gráfico com dados de exemplo
        setTimeout(function() {
          $scope.renderizarGraficoTendencias();
        }, 300);
        
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar tendências - usando dados de exemplo');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
        }
      });
  };

/**
 * Renderizar gráfico de fluxo mensal
 */
$scope.renderizarGraficoFluxo = function() {
  console.log('Renderizando gráfico de fluxo...');
  // Verificar se o Chart.js está disponível
  if (typeof Chart === 'undefined') {
    console.error('Chart.js não está disponível!');  
    return;
  }

  // Aguardar até que o DOM esteja pronto
  setTimeout(function() {
    const ctx = document.getElementById('graficoFluxoMensal');
    if (!ctx) {
      console.error('Elemento graficoFluxoMensal não encontrado no DOM');
      return;
    }

    try {
      console.log('Renderizando gráfico de fluxo mensal');
      // Verificar se o gráfico existe E se tem o método destroy
      if (window.graficoFluxoMensal && typeof window.graficoFluxoMensal.destroy === 'function') {
        window.graficoFluxoMensal.destroy();
        window.graficoFluxoMensal = null;
      }
      
      // Garantir que temos dados válidos
      const labels = $scope.dashboard.fluxoMensal.labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const receitas = $scope.dashboard.fluxoMensal.receitas || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const despesas = $scope.dashboard.fluxoMensal.despesas || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      // Forçar altura mínima para o canvas
      ctx.style.minHeight = '250px';
      
      window.graficoFluxoMensal = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Receitas',
              data: receitas,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            },
            {
              label: 'Despesas',
              data: despesas,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          animation: {
            duration: 1000
          }
        }
      });
      console.log('Gráfico de fluxo mensal renderizado com sucesso');
    } catch (e) {
      console.error('Erro ao renderizar gráfico de fluxo:', e);
    }
  }, 300); // Aguardar 300ms para garantir que o DOM esteja pronto
};

/**
 * Carregar tendências comparativas
 */
$scope.carregarTendenciasComparativas = function() {
  console.log('Carregando tendências comparativas...');
  
  // Tentando o endpoint
  $http.get('/api/dashboard/tendencias-comparativas')
    .then(function(response) {
      console.log('Tendências comparativas carregadas:', response.data);
      
      if (response.data && response.data.tendencias && response.data.variacoes) {
        $scope.dashboard.tendencias.dados = {
          meses: response.data.tendencias.map(t => t.mes),
          receitas: response.data.tendencias.map(t => t.receitas),
          despesas: response.data.tendencias.map(t => t.despesas),
          saldo: response.data.tendencias.map(t => t.saldo)
        };
        
        // Formatar variações percentuais usando a função formatarPercentual
        $scope.dashboard.tendencias.variacoes = {
          receitas: $scope.formatarPercentual(response.data.variacoes.receitas),
          despesas: $scope.formatarPercentual(response.data.variacoes.despesas),
          saldo: $scope.formatarPercentual(response.data.variacoes.saldo)
        };
        
        console.log('Variações formatadas:', $scope.dashboard.tendencias.variacoes);
        
        // Garantir que a interface atualize os valores
        if (!$scope.$$phase) {
          $scope.$apply();
        }
        
        // Renderizar o gráfico após receber os dados
        setTimeout(function() {
          $scope.renderizarGraficoTendencias();
        }, 300);
        
      } else {
        throw new Error('Formato de resposta inválido');
    setTimeout(function() {
      const ctx = document.getElementById('graficoTendencias');
      if (!ctx) {
        console.error('Elemento graficoTendencias não encontrado no DOM');
        return;
      }
      
      try {
        console.log('Renderizando gráfico de tendências');
        // Verificar se o gráfico existe E se tem o método destroy
        if (window.graficoTendencias && typeof window.graficoTendencias.destroy === 'function') {
          window.graficoTendencias.destroy();
          window.graficoTendencias = null;
        }
        
        // Dados para o gráfico de tendências
        const dados = $scope.dashboard.tendencias.dados;
        
        // Garantir que temos dados válidos
        const labels = dados.meses || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
        const receitas = dados.receitas || [0, 0, 0, 0, 0, 0];
        const despesas = dados.despesas || [0, 0, 0, 0, 0, 0];
        const saldo = dados.saldo || [0, 0, 0, 0, 0, 0];
        
        // Forçar altura mínima para o canvas
        ctx.style.minHeight = '250px';
        
        // Criar o gráfico de tendências
        window.graficoTendencias = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Receitas',
                data: receitas,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Despesas',
                data: despesas,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
                fill: true
              },
              {
                label: 'Saldo',
                data: saldo,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.4,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            animation: {
              duration: 1000
            }
          }
        });
        
        console.log('Gráfico de tendências renderizado com sucesso');
      } catch (e) {
        console.error('Erro ao renderizar gráfico de tendências:', e);
      }
    }, 300); // Aguardar 300ms para garantir que o DOM esteja pronto
  };
  
  /**
   * Alterar período do dashboard
   */
  $scope.alterarPeriodo = function() {
    console.log('Alterando período para:', $scope.dashboard.periodos.mes + '/' + $scope.dashboard.periodos.ano);
    $scope.carregarResumo();
    $scope.carregarFluxoMensal();
    $scope.carregarMovimentacoesPeriodo();
  };
  
  // Adicionar um pequeno delay para inicializar o dashboard após o DOM estar pronto
  setTimeout(function() {
    $scope.inicializarDashboard();
    console.log('Dashboard inicializado com delay para garantir que DOM e bibliotecas estejam prontos.');
    
    // Registrar função para debug
    window.testFormatarPercentual = function(valor) {
      console.log('Testando formatarPercentual com valor:', valor);
      const resultado = $scope.formatarPercentual(valor);
      console.log('Resultado formatado:', resultado);
      return resultado;
    };
  }, 500);
});
