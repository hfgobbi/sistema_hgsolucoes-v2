// Controller para Categorias
app.controller('CategoriaController', ['$scope', 'categoriaService', function($scope, categoriaService) {
  var vm = this;
  
  // Lista de categorias
  vm.categorias = [];
  
  // Nova categoria
  vm.novaCategoria = '';
  
  // Categoria em edição
  vm.categoriaEmEdicao = null;
  
  // Carrega as categorias
  vm.carregarCategorias = function() {
    categoriaService.listar()
      .then(function(categorias) {
        vm.categorias = categorias;
      })
      .catch(function(erro) {
        console.error('Erro ao carregar categorias:', erro);
        alert('Erro ao carregar categorias');
      });
  };
  
  // Adicionar nova categoria
  vm.adicionarCategoria = function() {
    if (!vm.novaCategoria) {
      alert('Digite o nome da categoria');
      return;
    }
    
    categoriaService.adicionar({ descricao: vm.novaCategoria })
      .then(function(categoria) {
        alert('Categoria adicionada com sucesso!');
        vm.novaCategoria = '';
        vm.carregarCategorias();
      })
      .catch(function(erro) {
        console.error('Erro ao adicionar categoria:', erro);
        alert('Erro ao adicionar categoria: ' + (erro.data && erro.data.message ? erro.data.message : 'Verifique os dados'));
      });
  };
  
  // Iniciar edição de categoria
  vm.iniciarEdicao = function(categoria) {
    // Clone a categoria para edição
    vm.categoriaEmEdicao = {
      id: categoria.id,
      descricao: categoria.descricao
    };
  };
  
  // Cancelar edição
  vm.cancelarEdicao = function() {
    vm.categoriaEmEdicao = null;
  };
  
  // Salvar edição
  vm.salvarEdicao = function() {
    if (!vm.categoriaEmEdicao.descricao) {
      alert('Digite o nome da categoria');
      return;
    }
    
    categoriaService.atualizar(vm.categoriaEmEdicao.id, { descricao: vm.categoriaEmEdicao.descricao })
      .then(function() {
        alert('Categoria atualizada com sucesso!');
        vm.categoriaEmEdicao = null;
        vm.carregarCategorias();
      })
      .catch(function(erro) {
        console.error('Erro ao atualizar categoria:', erro);
        alert('Erro ao atualizar categoria: ' + (erro.data && erro.data.message ? erro.data.message : 'Verifique os dados'));
      });
  };
  
  // Remover categoria
  vm.removerCategoria = function(id) {
    if (confirm('Tem certeza que deseja remover esta categoria?')) {
      categoriaService.remover(id)
        .then(function() {
          alert('Categoria removida com sucesso!');
          vm.carregarCategorias();
        })
        .catch(function(erro) {
          console.error('Erro ao remover categoria:', erro);
          alert('Erro ao remover categoria: ' + (erro.data && erro.data.message ? erro.data.message : 'Pode haver movimentações vinculadas'));
        });
    }
  };
  
  // Inicialização
  vm.carregarCategorias();
}]);
