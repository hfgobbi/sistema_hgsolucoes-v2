// Controller para Movimentações

// Controller para listagem de movimentações
app.controller('MovimentacoesListController', ['$scope', '$location', 'movimentacaoService', 'categoriaService', 
  function($scope, $location, movimentacaoService, categoriaService) {
    var vm = this;
    
    // Lista de movimentações
    vm.movimentacoes = [];
    
    // Filtros
    vm.filtros = {
      mes: new Date().getMonth() + 1, // Mês atual (1-12)
      ano: new Date().getFullYear(),
      tipo: null,
      categoria_id: null
    };
    
    // Meses para o filtro
    vm.meses = [
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
    
    // Anos para o filtro
    vm.anos = [];
    var anoAtual = new Date().getFullYear();
    for (var i = anoAtual - 5; i <= anoAtual + 1; i++) {
      vm.anos.push(i);
    }
    
    // Tipos para o filtro
    vm.tipos = [
      { valor: null, nome: 'Todos' },
      { valor: 'receita', nome: 'Receitas' },
      { valor: 'despesa', nome: 'Despesas' }
    ];
    
    // Categorias
    vm.categorias = [];
    
    // Carrega as categorias
    vm.carregarCategorias = function() {
      categoriaService.listar()
        .then(function(categorias) {
          vm.categorias = categorias;
          vm.categoriasFiltro = [{ id: null, descricao: 'Todas' }].concat(categorias);
        })
        .catch(function(erro) {
          console.error('Erro ao carregar categorias:', erro);
        });
    };
    
    // Carrega as movimentações
    vm.carregarMovimentacoes = function() {
      // Formatar o mês para ter sempre 2 dígitos
      var filtros = Object.assign({}, vm.filtros);
      if (filtros.mes) {
        filtros.mes = ("0" + filtros.mes).slice(-2);
      }
      
      console.log('Buscando movimentações com filtros:', filtros);
      
      movimentacaoService.listar(filtros)
        .then(function(movimentacoes) {
          console.log('Movimentações encontradas:', movimentacoes.length);
          vm.movimentacoes = movimentacoes;
        })
        .catch(function(erro) {
          console.error('Erro ao carregar movimentações:', erro);
        });
    };
    
    // Aplicar filtros
    vm.aplicarFiltros = function() {
      // Log para verificar os filtros sendo enviados
      console.log('Aplicando filtros:', JSON.stringify(vm.filtros));
      vm.carregarMovimentacoes();
    };
    
    // Traduzir status de pagamento
    vm.traduzirStatus = function(status) {
      switch (status) {
        case 'pago': return 'Pago';
        case 'pendente': return 'Pendente';
        case 'a_pagar': return 'A Pagar';
        case 'vencido': return 'Vencido';
        default: return status;
      }
    };
    
    // Verificar se uma movimentação está vencida
    vm.estaVencida = function(mov) {
      if (!mov.data_vencimento) return false;
      
      var dataVencimento = new Date(mov.data_vencimento);
      var hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Remover horas/minutos/segundos para comparação apenas de data
      
      return dataVencimento < hoje && mov.status_pagamento !== 'pago';
    };
    
    // Marcar uma movimentação como paga
    vm.marcarComoPago = function(id) {
      movimentacaoService.marcarComoPago(id)
        .then(function() {
          alert('Movimentação marcada como paga com sucesso!');
          vm.carregarMovimentacoes();
        })
        .catch(function(erro) {
          console.error('Erro ao marcar movimentação como paga:', erro);
          alert('Erro ao marcar movimentação como paga');
        });
    };
    
    // Formatar valor 
    vm.formatarValor = function(valor, tipo) {
      return (tipo === 'despesa' ? '-' : '') + 'R$ ' + parseFloat(valor).toFixed(2);
    };
    
    // Ir para a tela de cadastro de movimentação
    vm.novaMovimentacao = function() {
      $location.path('/movimentacoes/nova');
    };
    
    // Editar movimentação
    vm.editarMovimentacao = function(id) {
      $location.path('/movimentacoes/' + id);
    };
    
    // Variável para armazenar o item a ser excluído
    vm.itemParaExcluir = {
      id: null,
      descricao: ''
    };
    
    // Abrir modal de confirmação
    vm.confirmarExclusao = function(id, descricao) {
      vm.itemParaExcluir.id = id;
      vm.itemParaExcluir.descricao = descricao;
      $('#modalConfirmacao').modal('show');
    };
    
    // Confirmar e remover a movimentação
    vm.confirmarRemocao = function() {
      movimentacaoService.remover(vm.itemParaExcluir.id)
        .then(function() {
          $('#modalConfirmacao').modal('hide');
          // Usar setTimeout para garantir que o modal seja fechado antes de exibir a mensagem
          setTimeout(function() {
            alert('Movimentação removida com sucesso!');
            vm.carregarMovimentacoes();
          }, 500);
        })
        .catch(function(erro) {
          console.error('Erro ao remover movimentação:', erro);
          alert('Erro ao remover movimentação');
          $('#modalConfirmacao').modal('hide');
        });
    };
    
    // Inicialização
    vm.carregarCategorias();
    vm.carregarMovimentacoes();
  }
]);

// Controller para cadastro/edição de movimentações
app.controller('MovimentacoesCadController', ['$scope', '$routeParams', '$location', 'movimentacaoService', 'categoriaService',
  function($scope, $routeParams, $location, movimentacaoService, categoriaService) {
    var vm = this;
    
    // ID da movimentação (null para nova movimentação)
    vm.id = $routeParams.id;
    
    // Modelo para a movimentação
    vm.movimentacao = {
      descricao: '',
      valor: '',
      tipo: 'despesa',
      data: new Date(),
      data_vencimento: new Date(),
      status_pagamento: 'a_pagar',
      categoria_id: null,
      observacao: '',
      tipo_frequencia: 'unica',
      parcelas_total: 2 // Valor padrão para quando for selecionado parcelada
    };
    
    // Tipos de movimentação
    vm.tipos = [
      { valor: 'receita', nome: 'Receita' },
      { valor: 'despesa', nome: 'Despesa' }
    ];
    
    // Tipos de frequência
    vm.tiposFrequencia = [
      { valor: 'unica', nome: 'Única' },
      { valor: 'fixa', nome: 'Fixa' },
      { valor: 'parcelada', nome: 'Parcelada' }
    ];
    
    // Status de pagamento
    vm.statusPagamento = [
      { valor: 'pago', nome: 'Pago' },
      { valor: 'pendente', nome: 'Pendente' },
      { valor: 'a_pagar', nome: 'A Pagar' },
      { valor: 'vencido', nome: 'Vencido' }
    ];
    
    // Categorias
    vm.categorias = [];
    
    // Carrega as categorias
    vm.carregarCategorias = function() {
      categoriaService.listar()
        .then(function(categorias) {
          vm.categorias = categorias;
        })
        .catch(function(erro) {
          console.error('Erro ao carregar categorias:', erro);
        });
    };
    
    // Carregar movimentação pelo ID
    vm.carregarMovimentacao = function() {
      if (vm.id && vm.id !== 'nova') {
        movimentacaoService.buscarPorId(vm.id)
          .then(function(movimentacao) {
            // Formatar as datas
            movimentacao.data = new Date(movimentacao.data);
            if (movimentacao.data_vencimento) {
              movimentacao.data_vencimento = new Date(movimentacao.data_vencimento);
            } else if (movimentacao.tipo === 'despesa') {
              // Se não tiver data de vencimento e for despesa, usar a data da movimentação
              movimentacao.data_vencimento = new Date(movimentacao.data);
            }
            vm.movimentacao = movimentacao;
          })
          .catch(function(erro) {
            console.error('Erro ao carregar movimentação:', erro);
            alert('Erro ao carregar movimentação');
            $location.path('/movimentacoes');
          });
      }
    };
    
    // Salvar movimentação
    vm.salvar = function() {
      // Validar campos
      if (!vm.movimentacao.descricao || !vm.movimentacao.valor || 
          !vm.movimentacao.data || !vm.movimentacao.categoria_id) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }
      
      // Formatar valor como número - garantindo que seja string antes de converter
      vm.movimentacao.valor = parseFloat(String(vm.movimentacao.valor).replace(',', '.'));
      
      // Verificar se é adição ou atualização
      if (vm.id && vm.id !== 'nova') {
        // Atualizar
        movimentacaoService.atualizar(vm.id, vm.movimentacao)
          .then(function() {
            alert('Movimentação atualizada com sucesso!');
            $location.path('/movimentacoes');
          })
          .catch(function(erro) {
            console.error('Erro ao atualizar movimentação:', erro);
            alert('Erro ao atualizar movimentação');
          });
      } else {
        // Adicionar
        movimentacaoService.adicionar(vm.movimentacao)
          .then(function() {
            alert('Movimentação adicionada com sucesso!');
            $location.path('/movimentacoes');
          })
          .catch(function(erro) {
            console.error('Erro ao adicionar movimentação:', erro);
            alert('Erro ao adicionar movimentação');
          });
      }
    };
    
    // Cancelar e voltar para a listagem
    vm.cancelar = function() {
      $location.path('/movimentacoes');
    };
    
    // Inicialização
    vm.carregarCategorias();
    vm.carregarMovimentacao();
  }
]);
