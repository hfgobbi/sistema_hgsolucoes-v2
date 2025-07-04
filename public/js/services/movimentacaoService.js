// Serviço de gerenciamento de movimentações financeiras
app.service('movimentacaoService', ['$http', function($http) {
  var service = {};

  // URL base da API
  var baseUrl = '/api/movimentacoes';

  // Listar todas as movimentações com suporte a paginação
  service.listar = function(filtros) {
    var url = baseUrl;
    if (filtros) {
      url += '?';
      var params = [];
      if (filtros.mes) {
        // Formatar o mês com 2 dígitos (1 -> 01, 2 -> 02, etc.)
        var mesFormatado = ("0" + filtros.mes).slice(-2);
        params.push('mes=' + mesFormatado);
      }
      if (filtros.ano) params.push('ano=' + filtros.ano);
      if (filtros.tipo) params.push('tipo=' + filtros.tipo);
      if (filtros.categoria_id) params.push('categoria_id=' + filtros.categoria_id);
      if (filtros.periodo) params.push('periodo=' + filtros.periodo);
      if (filtros.por_vencimento) params.push('por_vencimento=' + filtros.por_vencimento);
      if (filtros.incluir_cancelados) params.push('incluir_cancelados=' + filtros.incluir_cancelados);
      
      // Parâmetros de paginação
      if (filtros.pagina) params.push('pagina=' + filtros.pagina);
      if (filtros.limite) params.push('limite=' + filtros.limite);
      
      url += params.join('&');
    }
    
    console.log('Buscando movimentações:', url);
    
    return $http.get(url)
      .then(function(response) {
        console.log('Resposta completa do servidor:', response.data);
        
        // Verificar se o backend está retornando formato de paginação
        if (response.data && response.data.resultados && Array.isArray(response.data.resultados)) {
          console.log('Movimentações encontradas (formato paginado):', response.data.resultados.length, 'de', response.data.total);
          
          // Garantir que cada resultado tenha os campos necessários
          response.data.resultados.forEach(function(mov) {
            // Garantir que campos obrigatórios existam para evitar erros no template
            mov.descricao = mov.descricao || 'Sem descrição';
            mov.valor = mov.valor || 0;
            mov.tipo = mov.tipo || 'despesa';
            mov.data = mov.data || new Date();
            // Garantir que categoria exista como objeto
            if (!mov.categoria) mov.categoria = {descricao: 'Sem categoria'};
          });
          
          return response.data; // Retorna objeto completo com metadados de paginação
        } else if (Array.isArray(response.data)) {
          console.log('Movimentações encontradas (formato array):', response.data.length);
          // Formato compatível para caso o backend ainda não suporte paginação
          
          // Garantir que cada resultado tenha os campos necessários
          response.data.forEach(function(mov) {
            // Garantir que campos obrigatórios existam para evitar erros no template
            mov.descricao = mov.descricao || 'Sem descrição';
            mov.valor = mov.valor || 0;
            mov.tipo = mov.tipo || 'despesa';
            mov.data = mov.data || new Date();
            // Garantir que categoria exista como objeto
            if (!mov.categoria) mov.categoria = {descricao: 'Sem categoria'};
          });
          
          return {
            resultados: response.data,
            total: response.data.length,
            pagina: 1,
            totalPaginas: 1,
            limite: response.data.length
          };
        } else {
          console.error('Formato de resposta inesperado:', response.data);
          return {
            resultados: [],
            total: 0,
            pagina: 1,
            totalPaginas: 1,
            limite: 10
          };
        }
      })
      .catch(function(error) {
        console.error('Erro ao listar movimentações:', error);
        return {
          resultados: [],
          total: 0,
          pagina: 1,
          totalPaginas: 1,
          limite: 10
        };
      });
  };

  // Buscar movimentação por ID
  service.buscarPorId = function(id) {
    return $http.get(baseUrl + '/' + id)
      .then(function(response) {
        return response.data;
      });
  };

  // Adicionar nova movimentação
  service.adicionar = function(movimentacao) {
    return $http.post(baseUrl, movimentacao)
      .then(function(response) {
        return response.data;
      });
  };

  // Atualizar movimentação
  service.atualizar = function(id, movimentacao) {
    return $http.put(baseUrl + '/' + id, movimentacao)
      .then(function(response) {
        return response.data;
      });
  };

  // Remover movimentação
  service.remover = function(id) {
    return $http.delete(baseUrl + '/' + id)
      .then(function(response) {
        return response.data;
      });
  };

  // Obter estatísticas para o dashboard
  service.obterEstatisticas = function(ano) {
    var url = '/api/estatisticas';
    if (ano) {
      url += '?ano=' + ano;
    }
    
    return $http.get(url)
      .then(function(response) {
        return response.data;
      });
  };
  
  // Marcar uma movimentação como paga
  service.marcarComoPago = function(id) {
    return $http.put(baseUrl + '/' + id + '/marcar-pago')
      .then(function(response) {
        return response.data;
      });
  };

  return service;
}]);
