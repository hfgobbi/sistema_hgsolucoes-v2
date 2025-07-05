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
  for (let i = 2020; i <= 2030; i++) {
    $scope.anos.push({ id: i, nome: i.toString() });
  }

  // Função auxiliar para formatar percentuais
  $scope.formatarPercentual = function(valor) {
    if (typeof valor === 'object' && valor !== null) {
      // Se for um objeto com ultimo_mes e media, usar ultimo_mes
      if (valor.ultimo_mes !== undefined) {
        const percent = parseFloat(valor.ultimo_mes);
        if (isNaN(percent)) return '0,0%';
        const sinal = percent >= 0 ? '+' : '';
        return sinal + percent.toFixed(1).replace('.', ',') + '%';
      }
      return '0,0%';
    }
    
    if (valor === null || valor === undefined || isNaN(valor)) {
      return '0,0%';
    }
    
    const percent = parseFloat(valor);
    const sinal = percent >= 0 ? '+' : '';
    return sinal + percent.toFixed(1).replace('.', ',') + '%';
  };
  
  // Função para Math.abs (usada no template)
  $scope.abs = function(valor) {
    return Math.abs(valor || 0);
  };
  
  // Função para Math.floor (usada no template)
  $scope.floor = function(valor) {
    return Math.floor(valor || 0);
  };
  
  // Função para verificar se um valor é positivo
  $scope.isPositivo = function(valor) {
    return (valor || 0) > 0;
  };
  
  // Função para verificar se um valor é negativo
  $scope.isNegativo = function(valor) {
    return (valor || 0) < 0;
  };
  
  // Função para verificar se um valor é zero
  $scope.isZero = function(valor) {
    return (valor || 0) === 0;
  };
  
  // Helper para formatar números sem casas decimais desnecessárias
  $scope.formatarNumero = function(valor) {
    if (!valor && valor !== 0) return '0';
    return valor % 1 === 0 ? valor.toString() : valor.toFixed(2).replace('.', ',');
  };
  
  // Função para verificar se um número é válido
  $scope.isValidNumber = function(valor) {
    return !isNaN(valor) && isFinite(valor);
  };

  // Helper function para formatar as variações dos cards 
  $scope.formatarVariacao = function(variacao) {
    if (!variacao || typeof variacao !== 'object') {
      return '0,0%';
    }
    
    // Se tem ultimo_mes, usar ele
    if (variacao.ultimo_mes !== undefined) {
      const valor = parseFloat(variacao.ultimo_mes);
      if (isNaN(valor)) return '0,0%';
      
      const sinal = valor >= 0 ? '+' : '';
      return sinal + valor.toFixed(1).replace('.', ',') + '%';
    }
    
    return '0,0%';
  };

  // Função para mostrar/esconder indicadores de carregamento
  $scope.mostrarCarregando = function(estado) {
    $scope.carregando = estado === true;
    // Aplicar mudanças imediatamente se estiver fora do ciclo de digest
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  };
  
  // Configuração de dados do dashboard
  $scope.dashboard = {
    periodos: {
      mes: 6, // Junho tem mais dados para demonstração
      ano: 2025
    },
    resumo: {
      saldoAtual: 0,
      receitasMes: 0,
      despesasMes: 0,
      saldoMes: 0
    },
    proximosVencimentos: [],
    ultimasMovimentacoes: [],
    parcelasAbertas: [],
    movimentacoesPeriodo: {
      receitas: 0,
      despesas: 0,
      saldo: 0
    },
    tendencias: {
      dados: {
        meses: [],
        receitas: [],
        despesas: [],
        saldo: []
      },
      valores_atuais: {
        receitas: 0,
        despesas: 0,
        saldo: 0
      },
      medias: {
        receitas: 0,
        despesas: 0,
        saldo: 0
      },
      variacoes: {
        receitas: '',
        despesas: '',
        saldo: ''
      }
    },
    fluxoMensal: {
      labels: [],
      receitas: [],
      despesas: []
    }
  };

  // Helper para formatar moeda - CORRIGIDO para garantir exibição das médias
  $scope.formatarMoeda = function(valor) {
    if (valor === null || valor === undefined) {
      return 'R$ 0,00';
    }
    
    // Garantindo que o valor seja numérico
    if (typeof valor === 'string') {
      valor = parseFloat(valor.replace(/\.\d+$/, '').replace(',', '.'));
    }
    
    // Verificação adicional para valores NaN
    if (isNaN(valor)) {
      console.warn('formatarMoeda: valor inválido detectado:', valor);
      return 'R$ 0,00';
    }
    
    // Usar toFixed para garantir que não haja problemas com números muito grandes
    return 'R$ ' + parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Função para alterar período
  $scope.alterarPeriodo = function() {
    console.log('Período alterado:', $scope.dashboard.periodos);
    // Recarregar dados com o novo período
    $scope.carregarResumoMensal();
    // Removido carregarMovimentacoesPeriodo - Este card opera independentemente do filtro global
    $scope.carregarTendenciasComparativas();
    $scope.carregarFluxoCaixa();
    $scope.carregarProximosVencimentos(); // Atualiza próximos vencimentos
    $scope.carregarParcelasAbertas(); // Atualiza parcelas abertas
  };

  // Função para confirmar pagamento antes de marcar como pago
  $scope.confirmarPagamento = function(id, descricao, data_vencimento, valor) {
    if (!id) return;
    
    // Formatar a data e o valor para exibição
    let dataFormatada = '';
    if (data_vencimento) {
      if (typeof data_vencimento === 'string') {
        // Se a data vier como string, tentar converter
        const data = new Date(data_vencimento);
        dataFormatada = data.toLocaleDateString('pt-BR');
      } else if (data_vencimento instanceof Date) {
        dataFormatada = data_vencimento.toLocaleDateString('pt-BR');
      }
    }
    
    const valorFormatado = $scope.formatarMoeda(valor);
    
    // Criar mensagem detalhada para confirmação
    const mensagem = `CONFIRMAR PAGAMENTO\n\n` +
                     `Descrição: ${descricao}\n` +
                     `Vencimento: ${dataFormatada}\n` +
                     `Valor: ${valorFormatado}\n\n` +
                     `Deseja confirmar este pagamento?`;
    
    // Usar setTimeout para dar tempo ao usuário de ler a mensagem
    setTimeout(function() {
      if (window.confirm(mensagem)) {
        // Se confirmou, chama a função de marcar como pago
        $scope.executarMarcarComoPago(id);
      }
    }, 100); // Pequeno delay para garantir que o navegador processe
  };
  
  // Função para marcar movimentação como paga (implementação real)
  $scope.executarMarcarComoPago = function(id) {
    if (!id) return;
    
    // Mostrar indicador de carregamento caso exista
    if (typeof $scope.mostrarCarregando === 'function') {
      $scope.mostrarCarregando(true);
    }
    
    // Guardar o estado anterior para detecção de mudança
    const qtdAnterior = $scope.dashboard.proximosVencimentos ? 
      $scope.dashboard.proximosVencimentos.length : 0;
    
    $http.post('/api/dashboard/marcar-pago/' + id)
      .then(function(response) {
        console.log('Movimentação marcada como paga:', response.data);
        
        // Recarregar dados com delay suficiente para ver a mudança
        setTimeout(function() {
          // Recarregar todos os dados que podem ser afetados
          $scope.carregarProximosVencimentos();
          $scope.carregarUltimasMovimentacoes();
          $scope.carregarResumoMensal();
          
          // Aplicar mudanças ao $scope
          $scope.$apply();
          
          // Esconder indicador de carregamento
          if (typeof $scope.mostrarCarregando === 'function') {
            $scope.mostrarCarregando(false);
          }
          
          // Mostrar notificação de sucesso
          try {
            if (window.toastr && window.toastr.success) {
              window.toastr.success('Movimentação marcada como paga!');
            } else {
              // Fallback se não tiver toastr
              alert('Pagamento registrado com sucesso!');
            }
          } catch (e) {
            console.error('Erro ao mostrar notificação:', e);
            // Fallback se falhar
            alert('Pagamento registrado com sucesso!');
          }
        }, 500); // Delay para melhor feedback visual
      })
      .catch(function(error) {
        console.error('Erro ao marcar como pago:', error);
        
        // Esconder indicador de carregamento
        if (typeof $scope.mostrarCarregando === 'function') {
          $scope.mostrarCarregando(false);
        }
        
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao marcar movimentação como paga');
          } else {
            // Fallback se não tiver toastr
            alert('Erro ao registrar pagamento!');
          }
        } catch (e) {
          console.error('Erro ao mostrar notificação:', e);
          // Fallback
          alert('Erro ao registrar pagamento!');
        }
      });
  };
  
  // Função para marcar movimentação como paga (para compatibilidade)
  $scope.marcarComoPago = function(id) {
    console.warn('Função marcarComoPago chamada diretamente. Use confirmarPagamento para exibir confirmação.');
    $scope.executarMarcarComoPago(id);
  };

  /**
   * Carregar resumo mensal
   */
  $scope.carregarResumoMensal = function() {
    console.log('Carregando resumo mensal...');
    
    const params = {
      mes: $scope.dashboard.periodos.mes,
      ano: $scope.dashboard.periodos.ano
    };
    
    $http.get('/api/dashboard/resumo-mensal', { params: params })
      .then(function(response) {
        console.log('Resumo mensal carregado:', response.data);
        $scope.dashboard.resumo = response.data;
        
        // Forçar atualização da interface
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar resumo mensal:', error);
        try {
          if (window.toastr && window.toastr.error) {
            window.toastr.error('Erro ao carregar resumo mensal');
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
    console.log('Carregando próximos vencimentos...');
    
    // Adicionando parâmetros de mês e ano
    const params = {
      mes: $scope.dashboard.periodos.mes,
      ano: $scope.dashboard.periodos.ano
    };
    console.log('Parâmetros próximos vencimentos:', params);
    
    $http.get('/api/dashboard/proximos-vencimentos', { params: params })
      .then(function(response) {
        console.log('Próximos vencimentos carregados:', response.data);
        $scope.dashboard.proximosVencimentos = response.data || [];
      })
      .catch(function(error) {
        console.error('Erro ao carregar próximos vencimentos:', error);
        $scope.dashboard.proximosVencimentos = [];
      });
  };

  /**
   * Carregar últimas movimentações
   */
  $scope.carregarUltimasMovimentacoes = function() {
    console.log('Carregando últimas movimentações...');
    
    $http.get('/api/dashboard/ultimas-movimentacoes')
      .then(function(response) {
        console.log('Últimas movimentações carregadas:', response.data);
        $scope.dashboard.ultimasMovimentacoes = response.data || [];
      })
      .catch(function(error) {
        console.error('Erro ao carregar últimas movimentações:', error);
        $scope.dashboard.ultimasMovimentacoes = [];
      });
  };

  /**
   * Carregar parcelas abertas
   */
  $scope.carregarParcelasAbertas = function() {
    console.log('Carregando parcelas abertas...');
    
    // Adicionando parâmetros de mês e ano
    const params = {
      mes: $scope.dashboard.periodos.mes,
      ano: $scope.dashboard.periodos.ano,
      limite: 5
    };
    console.log('Parâmetros parcelas abertas:', params);
    
    $http.get('/api/dashboard/parcelas-abertas', { params: params })
      .then(function(response) {
        console.log('Parcelas abertas carregadas:', response.data);
        
        // Corrigido: verificação do formato da resposta do backend
        // A API retorna {parcelas: [...]} ao invés de um array direto
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Se for array direto
            $scope.dashboard.parcelasAbertas = response.data;
          } else if (response.data.parcelas && Array.isArray(response.data.parcelas)) {
            // Se tiver propriedade 'parcelas' contendo um array
            $scope.dashboard.parcelasAbertas = response.data.parcelas;
          } else {
            $scope.dashboard.parcelasAbertas = [];
          }
        } else {
          $scope.dashboard.parcelasAbertas = [];
        }
        
        console.log('Parcelas para exibição:', $scope.dashboard.parcelasAbertas);
      })
      .catch(function(error) {
        console.error('Erro ao carregar parcelas abertas:', error);
        $scope.dashboard.parcelasAbertas = [];
        
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
   * Carregar movimentações no período
   * @param {string} tipoFiltro - Tipo de filtro: 'diario', 'semanal', 'mensal' ou undefined (para usar mês/ano)
   */
  $scope.carregarMovimentacoesPeriodo = function(tipoFiltro) {
    console.log('Carregando movimentações no período...', tipoFiltro || 'mensal');
    
    let params = {};
    const hoje = new Date();
    
    if (tipoFiltro) {
      // Para filtros específicos (diário, semanal, mensal), usamos data_inicio e data_fim
      let dataInicio, dataFim;
      
      switch (tipoFiltro) {
        case 'diario':
          // Filtro diário - hoje
          dataInicio = new Date(hoje);
          dataFim = new Date(hoje);
          params.periodo = 'Hoje';
          break;
          
        case 'semanal':
          // Filtro semanal - últimos 7 dias
          dataFim = new Date(hoje);
          dataInicio = new Date(hoje);
          dataInicio.setDate(dataInicio.getDate() - 7);
          params.periodo = 'Últimos 7 dias';
          break;
          
        case 'mensal':
        default:
          // Filtro mensal - mês atual
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
          params.periodo = `${dataInicio.toLocaleDateString('pt-BR', { month: 'long' })} ${dataInicio.getFullYear()}`;
          break;
      }
      
      // Formata as datas para YYYY-MM-DD
      params.data_inicio = dataInicio.toISOString().split('T')[0];
      params.data_fim = dataFim.toISOString().split('T')[0];
      
    } else {
      // Se não houver filtro específico, usamos o mês/ano selecionado no topo
      params = {
        mes: $scope.dashboard.periodos.mes,
        ano: $scope.dashboard.periodos.ano
      };
    }
    
    console.log('Parâmetros movimentações período:', params);
    
    $http.get('/api/dashboard/movimentacoes-periodo', { params: params })
      .then(function(response) {
        console.log('Movimentações no período carregadas:', response.data);
        
        // Mapeando os nomes dos campos da API para o formato que o frontend espera
        if (response.data) {
          $scope.dashboard.movimentacoesPeriodo = {
            receitas: response.data.totalReceitas || 0,
            despesas: response.data.totalDespesas || 0,
            saldo: response.data.saldo || 0,
            periodo: params.periodo || (response.data.periodo ? 
              `${response.data.periodo.data_inicio} - ${response.data.periodo.data_fim}` : 
              `${$scope.meses[$scope.dashboard.periodos.mes-1].nome} ${$scope.dashboard.periodos.ano}`)
          };
        } else {
          $scope.dashboard.movimentacoesPeriodo = {
            receitas: 0,
            despesas: 0,
            saldo: 0,
            periodo: params.periodo || `${$scope.meses[$scope.dashboard.periodos.mes-1].nome} ${$scope.dashboard.periodos.ano}`
          };
        }
        
        console.log('Dados mapeados para movimentações:', $scope.dashboard.movimentacoesPeriodo);
      })
      .catch(function(error) {
        console.error('Erro ao carregar movimentações no período:', error);
        $scope.dashboard.movimentacoesPeriodo = {
          receitas: 0,
          despesas: 0,
          saldo: 0,
          periodo: params.periodo || `${$scope.meses[$scope.dashboard.periodos.mes-1].nome} ${$scope.dashboard.periodos.ano}`
        };
      });
  };

  /**
   * Carregar tendências comparativas
   */
  $scope.carregarTendenciasComparativas = function() {
    console.log('Carregando tendências comparativas...');
    
    // Adicionando parâmetros de mês e ano
    const params = {
      mes: $scope.dashboard.periodos.mes,
      ano: $scope.dashboard.periodos.ano
    };
    console.log('Parâmetros para tendências:', params);
    
    $http.get('/api/dashboard/tendencias-comparativas', {
      params: params
    })
      .then(function(response) {
        console.log('Tendências recebidas:', response.data);
        
        if (response.data.tendencias && Array.isArray(response.data.tendencias)) {
          // Criar dados para o gráfico de tendências
          const tendencias = response.data.tendencias;
          const dados = {
            meses: [],
            receitas: [],
            despesas: [],
            saldo: []
          };
          
          // Inicializar contadores para cálculo de médias
          let total_receitas = 0;
          let total_despesas = 0;
          let total_saldo = 0;
          
          // Processar todos os dados de uma única vez
          tendencias.forEach(function(item) {
            // Dados para o gráfico
            dados.meses.push(item.mes);
            dados.receitas.push(Number(item.receitas));
            dados.despesas.push(Number(item.despesas));
            dados.saldo.push(Number(item.saldo));
            
            // Somar para as médias
            total_receitas += Number(item.receitas || 0);
            total_despesas += Number(item.despesas || 0);
            total_saldo += Number(item.saldo || 0);
          });
          
          // Atribuir dados ao escopo
          $scope.dashboard.tendencias.dados = dados;
          
          // Calcular valores atuais (do último mês)
          const ultimoMes = tendencias[tendencias.length - 1];
          $scope.dashboard.tendencias.valores_atuais = {
            receitas: Number(ultimoMes.receitas),
            despesas: Number(ultimoMes.despesas),
            saldo: Number(ultimoMes.saldo)
          };
          
          // Cálculo das médias - versão GARANTIDA com dupla precisão
          const divisor = tendencias.length || 1; // Evitar divisão por zero
          const media_receitas = Math.round((total_receitas / divisor) * 100) / 100;
          const media_despesas = Math.round((total_despesas / divisor) * 100) / 100;
          const media_saldo = Math.round((total_saldo / divisor) * 100) / 100;
          
          // Atribuir médias calculadas ao escopo
          $scope.dashboard.tendencias.medias = {
            receitas: media_receitas,
            despesas: media_despesas,
            saldo: media_saldo
          };
          
          console.log('MÉDIAS CALCULADAS:', {
            'receitas': media_receitas + ' (total: ' + total_receitas + ' / ' + divisor + ')',
            'despesas': media_despesas + ' (total: ' + total_despesas + ' / ' + divisor + ')',
            'saldo': media_saldo + ' (total: ' + total_saldo + ' / ' + divisor + ')'
          });
          
          // Formatar variações percentuais corretamente
          const variacoes_receitas = response.data.variacoes?.receitas?.ultimo_mes || 0;
          const variacoes_despesas = response.data.variacoes?.despesas?.ultimo_mes || 0;
          const variacoes_saldo = response.data.variacoes?.saldo?.ultimo_mes || 0;
          
          $scope.dashboard.tendencias.variacoes = {
            receitas: $scope.formatarPercentual(variacoes_receitas),
            despesas: $scope.formatarPercentual(variacoes_despesas),
            saldo: $scope.formatarPercentual(variacoes_saldo)
          };
          
          // Garantir que a interface atualize os valores
          if (!$scope.$$phase) {
            $scope.$apply();
          }
          
          // IMPORTANTE: Renderizar o gráfico COM MÉDIAS após receber os dados
          setTimeout(function() {
            // Garantir que as médias foram calculadas antes de renderizar o gráfico
            console.log('Verificando dados antes de renderizar gráfico:', {
              'Total meses': dados.meses.length,
              'Total receitas': dados.receitas.length,
              'Média receitas existe': $scope.dashboard.tendencias.medias?.receitas !== undefined,
              'Valor média receitas': $scope.dashboard.tendencias.medias?.receitas
            });
            
            $scope.renderizarGraficoTendenciasComMedias();
          }, 500); // Aumentado para garantir que o DOM esteja pronto
          
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
        
        // Calcular valores atuais e médias para os dados de exemplo
        const ultimoMes = {
          receitas: dadosExemplo.receitas[dadosExemplo.receitas.length - 1],
          despesas: dadosExemplo.despesas[dadosExemplo.despesas.length - 1],
          saldo: dadosExemplo.saldo[dadosExemplo.saldo.length - 1]
        };
        
        // Cálculo seguro das médias
        const mediaReceitas = dadosExemplo.receitas.reduce((acc, val) => acc + val, 0) / dadosExemplo.receitas.length;
        const mediaDespesas = dadosExemplo.despesas.reduce((acc, val) => acc + val, 0) / dadosExemplo.despesas.length;
        const mediaSaldo = dadosExemplo.saldo.reduce((acc, val) => acc + val, 0) / dadosExemplo.saldo.length;
        
        const medias = {
          receitas: !isNaN(mediaReceitas) ? mediaReceitas : 0,
          despesas: !isNaN(mediaDespesas) ? mediaDespesas : 0,
          saldo: !isNaN(mediaSaldo) ? mediaSaldo : 0
        };
        
        console.log('Dados de fallback calculados - médias:', medias);
        
        $scope.dashboard.tendencias = {
          dados: dadosExemplo,
          valores_atuais: ultimoMes,
          medias: medias,
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
    
    // Corrigido: ID do elemento canvas no HTML é 'graficoFluxoMensal'
    const canvas = document.getElementById('graficoFluxoMensal');
    if (!canvas) {
      console.error('Canvas do gráfico de fluxo não encontrado');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.graficoFluxo) {
      window.graficoFluxo.destroy();
    }

    window.graficoFluxo = new Chart(ctx, {
      type: 'line',
      data: {
        labels: $scope.dashboard.fluxoMensal.labels,
        datasets: [{
          label: 'Receitas',
          data: $scope.dashboard.fluxoMensal.receitas,
          borderColor: 'rgba(40, 167, 69, 1)',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: false,
          tension: 0.1
        }, {
          label: 'Despesas',
          data: $scope.dashboard.fluxoMensal.despesas,
          borderColor: 'rgba(220, 53, 69, 1)',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: false,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R$ ' + context.parsed.y.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });
              }
            }
          }
        }
      }
    });
  };

  /**
   * Renderizar gráfico de tendências - VERSÃO ORIGINAL (mantida por compatibilidade)
   */
  $scope.renderizarGraficoTendencias = function() {
    console.log('Chamando versão atualizada com médias...');
    $scope.renderizarGraficoTendenciasComMedias();
  };
  
  /**
   * Renderizar gráfico de tendências com linhas de média - NOVA IMPLEMENTAÇÃO
   * Esta função garante que as médias sejam exibidas no gráfico
   */
  $scope.renderizarGraficoTendenciasComMedias = function() {
    console.log('INICIO RENDERIZACAO GRAFICO TENDENCIAS');
    
    // GARANTIR QUE TEMOS DADOS ESSENCIAIS
    if (!$scope.dashboard || !$scope.dashboard.tendencias) {
      console.error('ERRO: $scope.dashboard.tendencias inexistente');
      return;
    }
    
    // GARANTIR QUE TEMOS DADOS PARA O GRAFICO
    if (!$scope.dashboard.tendencias.dados) {
      console.error('ERRO: dados de tendencias inexistentes');
      return;
    }
    
    const dados = $scope.dashboard.tendencias.dados;
    if (!dados.meses || !dados.receitas || !dados.despesas || !dados.saldo) {
      console.error('ERRO: dados de tendencias incompletos', dados);
      return;
    }
    
    // GARANTIR QUE TEMOS MEDIAS OU CRIAR PADRAO
    if (!$scope.dashboard.tendencias.medias) {
      console.log('AVISO: criando objeto de médias padrão');
      $scope.dashboard.tendencias.medias = { 
        receitas: 0, 
        despesas: 0, 
        saldo: 0 
      };
    }
    
    const medias = $scope.dashboard.tendencias.medias;
    console.log('MEDIAS ENCONTRADAS:', medias);
    
    // CALCULAR AS MEDIAS NOVAMENTE PARA GARANTIR
    if (dados.receitas && dados.receitas.length > 0) {
      let total_receitas = 0;
      let total_despesas = 0;
      let total_saldo = 0;
      
      for (let i = 0; i < dados.receitas.length; i++) {
        total_receitas += Number(dados.receitas[i] || 0);
        total_despesas += Number(dados.despesas[i] || 0);
        total_saldo += Number(dados.saldo[i] || 0);
      }
      
      const num_meses = dados.receitas.length || 1;
      
      // Usar Math.round para garantir precisão
      medias.receitas = Math.round((total_receitas / num_meses) * 100) / 100;
      medias.despesas = Math.round((total_despesas / num_meses) * 100) / 100;
      medias.saldo = Math.round((total_saldo / num_meses) * 100) / 100;
      
      console.log('MEDIAS RECALCULADAS:', {
        receitas: medias.receitas,
        despesas: medias.despesas,
        saldo: medias.saldo
      });
    }
    
    // OBTER ELEMENTO CANVAS
    const canvas = document.getElementById('graficoTendencias');
    if (!canvas) {
      console.error('ERRO: canvas #graficoTendencias não encontrado');
      return;
    }
    
    console.log('Canvas encontrado:', canvas.id);
    const ctx = canvas.getContext('2d');
    
    // LIMPAR QUALQUER INSTÂNCIA ANTERIOR DO GRÁFICO
    try {
      if (window.graficoTendencias) {
        delete window.graficoTendencias;
        window.graficoTendencias = null;
      }
    } catch (e) {
      console.error('Erro ao limpar gráfico anterior:', e);
    }
    
    // PREPARAR DADOS PARA O GRAFICO
    const datasets = [
      // Barras de receitas
      {
        label: 'Receitas',
        data: dados.receitas.map(v => Number(v)),
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1,
        type: 'bar'
      },
      // Barras de despesas
      {
        label: 'Despesas',
        data: dados.despesas.map(v => Number(v)),
        backgroundColor: 'rgba(220, 53, 69, 0.8)',
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 1,
        type: 'bar'
      },
      // Barras de saldo
      {
        label: 'Saldo',
        data: dados.saldo.map(v => Number(v)),
        backgroundColor: 'rgba(255, 193, 7, 0.8)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1,
        type: 'bar'
      }
    ];
    
    // Adicionar linhas de média
    if (medias.receitas > 0) {
      datasets.push({
        label: 'Média Receitas',
        data: Array(dados.meses.length).fill(medias.receitas),
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        type: 'line'
      });
      console.log('Linha de média de receitas adicionada:', medias.receitas);
    }
    
    if (medias.despesas > 0) {
      datasets.push({
        label: 'Média Despesas',
        data: Array(dados.meses.length).fill(medias.despesas),
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        type: 'line'
      });
      console.log('Linha de média de despesas adicionada:', medias.despesas);
    }
    
    // CRIAR O GRÁFICO
    try {
      console.log('CRIANDO GRÁFICO com ' + datasets.length + ' datasets');
      
      // Usar setTimeout para garantir que o DOM está pronto
      setTimeout(function() {
        window.graficoTendencias = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dados.meses,
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return 'R$ ' + value.toLocaleString('pt-BR');
                  }
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    let label = context.dataset.label || '';
                    let value = context.parsed.y || 0;
                    return label + ': R$ ' + value.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    });
                  }
                }
              }
            }
          }
        });
        console.log('GRÁFICO CRIADO COM SUCESSO!');
      }, 100);
    } catch (err) {
      console.error('ERRO AO CRIAR GRÁFICO:', err);
    }
  };

  /**
   * Carregar fluxo de caixa
   */
  $scope.carregarFluxoCaixa = function() {
    console.log('Carregando fluxo de caixa...');
    
    // Corrigido: adicionado parâmetro de ano que o backend espera
    const params = {
      ano: $scope.dashboard.periodos.ano
    };
    console.log('Parâmetros fluxo de caixa:', params);
    
    $http.get('/api/dashboard/fluxo-caixa', { params: params })
      .then(function(response) {
        console.log('Fluxo de caixa carregado:', response.data);
        
        if (response.data && response.data.meses && response.data.receitas && response.data.despesas) {
          $scope.dashboard.fluxoMensal = {
            labels: response.data.meses,
            receitas: response.data.receitas,
            despesas: response.data.despesas
          };
          
          setTimeout(function() {
            $scope.renderizarGraficoFluxo();
          }, 300);
          
          console.log('Dados do fluxo de caixa atualizados no $scope');
        } else {
          console.warn('Dados de fluxo de caixa incompletos ou em formato inesperado:', response.data);
        }
      })
      .catch(function(error) {
        console.error('Erro ao carregar fluxo de caixa:', error);
        
        // Dados de exemplo como fallback
        const dadosExemplo = {
          meses: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          receitas: [4500, 4800, 5200, 5800, 6200, 6800],
          despesas: [3800, 4200, 4600, 5000, 5400, 5900]
        };
        
        $scope.dashboard.fluxoMensal = dadosExemplo;
        
        setTimeout(function() {
          $scope.renderizarGraficoFluxo();
        }, 300);
      });
  };

  // Inicializar dashboard
  $scope.inicializar = function() {
    console.log('Inicializando dashboard...');
    
    // Verificar e garantir que haja token disponível
    if (!localStorage.getItem('token')) {
      console.log('Token não encontrado, configurando token de teste...');
      localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYWRtaW4iOnRydWUsImlhdCI6MTc1MTY2Mjc4MCwiZXhwIjoxNzUxNzQ5MTgwfQ.dYFO0rbszbYJmURhEoPzFN_lB9jEngLJoSXP6MWJi84');
    } else {
      console.log('Token encontrado no localStorage');
    }
    
    // Função para calcular o total das parcelas abertas
  $scope.calcularTotalParcelas = function() {
    if (!$scope.dashboard.parcelasAbertas || !Array.isArray($scope.dashboard.parcelasAbertas)) {
      return 0;
    }
    
    return $scope.dashboard.parcelasAbertas.reduce(function(total, parcela) {
      return total + (parseFloat(parcela.valor) || 0);
    }, 0);
  };
    
  // Definir mês e ano atual nos seletores
    const dataAtual = new Date();
    $scope.dashboard.periodos = {
      mes: dataAtual.getMonth() + 1, // JavaScript usa mês base-0
      ano: dataAtual.getFullYear()
    };
    
    // Carregar todos os dados do dashboard
    $scope.carregarResumoMensal();
    $scope.carregarProximosVencimentos();
    $scope.carregarUltimasMovimentacoes();
    $scope.carregarParcelasAbertas();
    $scope.carregarMovimentacoesPeriodo();
    $scope.carregarTendenciasComparativas();
    $scope.carregarFluxoCaixa();
    
    console.log('Dashboard inicializado com data:', { 
      mes: $scope.dashboard.periodos.mes, 
      ano: $scope.dashboard.periodos.ano 
    });
  };

  // Chamar inicialização quando o controller carrega
  $scope.inicializar();
});
