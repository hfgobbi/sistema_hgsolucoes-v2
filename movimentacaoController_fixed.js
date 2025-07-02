module.exports = (app) => {
  const controller = {};
  const { Movimentacao } = app.models;
  const { Categoria } = app.models;
  const { Op } = require('sequelize');
  
  // Listar todas as movimentações do usuário
  controller.listar = async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      
      // Obter parâmetros de filtro, se houver
      const { mes, ano, tipo, categoria_id } = req.query;
      
      // Montar a query de filtro
      const filtro = { usuario_id: usuarioId };
      
      // Filtrar por mês e ano se fornecidos
      if (mes && ano) {
        const dataInicio = new Date(`${ano}-${mes}-01`);
        const proxMes = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1;
        const proxAno = parseInt(mes) === 12 ? parseInt(ano) + 1 : parseInt(ano);
        const dataFim = new Date(`${proxAno}-${proxMes.toString().padStart(2, '0')}-01`);
        
        filtro.data = {
          [Op.gte]: dataInicio,
          [Op.lt]: dataFim
        };
      }
      
      // Filtrar por tipo se fornecido
      if (tipo && ['receita', 'despesa'].includes(tipo)) {
        filtro.tipo = tipo;
      }
      
      // Filtrar por categoria se fornecido
      if (categoria_id) {
        filtro.categoria_id = categoria_id;
      }
      
      // Buscar as movimentações
      const movimentacoes = await Movimentacao.findAll({
        where: filtro,
        include: [{ model: Categoria, as: 'categoria' }],
        order: [['data', 'DESC']]
      });
      
      return res.status(200).json(movimentacoes);
    } catch (error) {
      console.error('Erro ao listar movimentações:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Buscar movimentação por ID
  controller.buscarPorId = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      
      const movimentacao = await Movimentacao.findOne({
        where: { id, usuario_id: usuarioId },
        include: [{ model: Categoria, as: 'categoria' }]
      });
      
      if (!movimentacao) {
        return res.status(404).json({ message: 'Movimentação não encontrada' });
      }
      
      return res.status(200).json(movimentacao);
    } catch (error) {
      console.error('Erro ao buscar movimentação:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Adicionar nova movimentação
  controller.adicionar = async (req, res) => {
    try {
      const { descricao, valor, tipo, data, categoria_id, observacao, tipo_frequencia, status_pagamento, data_vencimento } = req.body;
      const usuarioId = req.usuario.id;
      
      // Validar campos obrigatórios
      if (!descricao || !valor || !tipo || !data || !categoria_id) {
        return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
      }
      
      // Verificar se o tipo é válido
      if (!['receita', 'despesa'].includes(tipo)) {
        return res.status(400).json({ message: 'Tipo inválido. Use "receita" ou "despesa"' });
      }
      
      // Verificar se a categoria existe e pertence ao usuário
      const categoria = await Categoria.findOne({
        where: { id: categoria_id, usuario_id: usuarioId }
      });
      
      if (!categoria) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      // Normalizar a data para garantir que fique na competência correta
      const dataNormalizada = normalizarData(data);
      
      // Definir data de pagamento se estiver marcado como pago
      let dataPagamento = null;
      if (status_pagamento === 'pago') {
        dataPagamento = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
      
      // Criar a nova movimentação
      const novaMovimentacao = await Movimentacao.create({
        descricao,
        valor,
        tipo,
        data: dataNormalizada,
        categoria_id,
        observacao,
        tipo_frequencia: tipo_frequencia || 'unica',
        status_pagamento: status_pagamento || 'pendente',
        data_vencimento,
        data_pagamento: dataPagamento,
        usuario_id: usuarioId
      });
      
      return res.status(201).json(novaMovimentacao);
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Função para normalizar a data e garantir a competência correta
  function normalizarData(dataString) {
    // IMPORTANTE: Se for uma string no formato YYYY-MM-DD, usar diretamente
    // sem criar objeto Date para evitar problemas de fuso horário
    if (typeof dataString === 'string') {
      // Se a data já estiver no formato YYYY-MM-DD, retorne-a diretamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
        return dataString;
      }
      
      // Se for string no formato ISO, extrair apenas a parte da data
      if (dataString.includes('T')) {
        return dataString.split('T')[0];
      }
    }
    
    // Manipulação cuidadosa para não alterar a data devido a timezone
    // Importante: criar a data forçando UTC para evitar ajustes
    // Este método preserva exatamente o dia, mês e ano informados
    const partes = dataString.split(/[\s\-\/T]/);
    if (partes.length >= 3) {
      // Se os componentes da data forem identificáveis
      let ano, mes, dia;
      
      // Identifica o formato da data e extrai corretamente
      if (partes[0].length === 4) {
        // Formato YYYY-MM-DD
        [ano, mes, dia] = partes;
      } else if (partes[2].length === 4) {
        // Formato DD/MM/YYYY
        [dia, mes, ano] = partes;
      } else {
        // Formato MM/DD/YYYY 
        [mes, dia, ano] = partes;
      }
      
      // Garantir que sejam números
      ano = parseInt(ano);
      mes = parseInt(mes);
      dia = parseInt(dia);
      
      // Formatar a data no formato YYYY-MM-DD
      return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }
    
    // Último recurso: usar UTC para evitar ajustes de fuso horário
    const data = new Date(dataString);
    const ano = data.getUTCFullYear();
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(data.getUTCDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  }
  
  // Atualizar movimentação
  controller.atualizar = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      const { descricao, valor, tipo, data, categoria_id, observacao, tipo_frequencia, status_pagamento, data_vencimento, data_pagamento } = req.body;
      
      // Verificar se a movimentação existe e pertence ao usuário
      const movimentacao = await Movimentacao.findOne({
        where: { id, usuario_id: usuarioId }
      });
      
      if (!movimentacao) {
        return res.status(404).json({ message: 'Movimentação não encontrada' });
      }
      
      // Verificar se a categoria existe e pertence ao usuário, se informada
      if (categoria_id && categoria_id !== movimentacao.categoria_id) {
        const categoria = await Categoria.findOne({
          where: { id: categoria_id, usuario_id: usuarioId }
        });
        
        if (!categoria) {
          return res.status(404).json({ message: 'Categoria não encontrada' });
        }
      }
      
      // Normalizar a data se fornecida para garantir a competência correta
      const dataNormalizada = data ? normalizarData(data) : movimentacao.data;
      
      // Lidar com a data de pagamento
      let novaDePagamento = movimentacao.data_pagamento;
      
      // Se estiver marcando como pago e não tiver data de pagamento, usar data atual
      if (status_pagamento === 'pago' && !movimentacao.data_pagamento) {
        novaDePagamento = new Date().toISOString().split('T')[0];
      } 
      // Se já tiver data de pagamento e não estiver mais marcado como pago, limpar a data
      else if (status_pagamento && status_pagamento !== 'pago' && movimentacao.data_pagamento) {
        novaDePagamento = null;
      }
      // Se tiver uma data de pagamento explícita no request, usar essa
      else if (data_pagamento) {
        novaDePagamento = normalizarData(data_pagamento);
      }
      
      // Atualizar os dados da movimentação
      await movimentacao.update({
        descricao: descricao || movimentacao.descricao,
        valor: valor !== undefined ? valor : movimentacao.valor,
        tipo: tipo || movimentacao.tipo,
        data: dataNormalizada,
        categoria_id: categoria_id || movimentacao.categoria_id,
        observacao: observacao !== undefined ? observacao : movimentacao.observacao,
        tipo_frequencia: tipo_frequencia || movimentacao.tipo_frequencia,
        status_pagamento: status_pagamento || movimentacao.status_pagamento,
        data_vencimento: data_vencimento !== undefined ? data_vencimento : movimentacao.data_vencimento,
        data_pagamento: novaDePagamento
      });
      
      return res.status(200).json({ message: 'Movimentação atualizada com sucesso', movimentacao });
    } catch (error) {
      console.error('Erro ao atualizar movimentação:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Remover movimentação
  controller.remover = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      
      // Verificar se a movimentação existe e pertence ao usuário
      const movimentacao = await Movimentacao.findOne({
        where: { id, usuario_id: usuarioId }
      });
      
      if (!movimentacao) {
        return res.status(404).json({ message: 'Movimentação não encontrada' });
      }
      
      // Remover a movimentação
      await movimentacao.destroy();
      
      return res.status(200).json({ message: 'Movimentação removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover movimentação:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Estatísticas para dashboard
  controller.estatisticas = async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      const { ano } = req.query;
      const anoAtual = ano || new Date().getFullYear().toString();
      
      // Array com os meses do ano
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      
      // Dados para gráfico de linha (evolução mensal)
      const dadosEvolucao = await Promise.all(meses.map(async (mes) => {
        const dataInicio = new Date(`${anoAtual}-${mes}-01`);
        const proxMes = parseInt(mes) === 12 ? 1 : parseInt(mes) + 1;
        const proxAno = parseInt(mes) === 12 ? parseInt(anoAtual) + 1 : parseInt(anoAtual);
        const dataFim = new Date(`${proxAno}-${proxMes.toString().padStart(2, '0')}-01`);
        
        // Receitas do mês
        const receitasMes = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'receita',
            data: {
              [Op.gte]: dataInicio,
              [Op.lt]: dataFim
            }
          }
        });
        
        // Despesas do mês
        const despesasMes = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'despesa',
            data: {
              [Op.gte]: dataInicio,
              [Op.lt]: dataFim
            }
          }
        });
        
        return {
          mes,
          receitas: receitasMes || 0,
          despesas: despesasMes || 0
        };
      }));
      
      // Dados para gráfico de pizza (despesas por categoria)
      const despesasPorCategoria = await Categoria.findAll({
        where: { usuario_id: usuarioId },
        include: [{
          model: Movimentacao,
          as: 'movimentacoes',
          where: {
            tipo: 'despesa',
            data: {
              [Op.gte]: new Date(`${anoAtual}-01-01`),
              [Op.lt]: new Date(`${parseInt(anoAtual) + 1}-01-01`)
            }
          },
          required: false
        }],
        attributes: ['id', 'descricao']
      });
      
      const totalDespesas = await Movimentacao.sum('valor', {
        where: {
          usuario_id: usuarioId,
          tipo: 'despesa',
          data: {
            [Op.gte]: new Date(`${anoAtual}-01-01`),
            [Op.lt]: new Date(`${parseInt(anoAtual) + 1}-01-01`)
          }
        }
      }) || 0;
      
      // Agrupar despesas por categoria
      const despesasCategorias = despesasPorCategoria.map(categoria => {
        const totalCategoria = categoria.movimentacoes.reduce((sum, mov) => sum + parseFloat(mov.valor), 0);
        return {
          id: categoria.id,
          descricao: categoria.descricao,
          valor: totalCategoria,
          percentual: totalDespesas > 0 ? (totalCategoria / totalDespesas) * 100 : 0
        };
      }).filter(c => c.valor > 0);
      
      // Dados para gráfico de pizza (receitas por categoria)
      const receitasPorCategoria = await Categoria.findAll({
        where: { usuario_id: usuarioId },
        include: [{
          model: Movimentacao,
          as: 'movimentacoes',
          where: {
            tipo: 'receita',
            data: {
              [Op.gte]: new Date(`${anoAtual}-01-01`),
              [Op.lt]: new Date(`${parseInt(anoAtual) + 1}-01-01`)
            }
          },
          required: false
        }],
        attributes: ['id', 'descricao']
      });
      
      const totalReceitas = await Movimentacao.sum('valor', {
        where: {
          usuario_id: usuarioId,
          tipo: 'receita',
          data: {
            [Op.gte]: new Date(`${anoAtual}-01-01`),
            [Op.lt]: new Date(`${parseInt(anoAtual) + 1}-01-01`)
          }
        }
      }) || 0;
      
      // Agrupar receitas por categoria
      const receitasCategorias = receitasPorCategoria.map(categoria => {
        const totalCategoria = categoria.movimentacoes.reduce((sum, mov) => sum + parseFloat(mov.valor), 0);
        return {
          id: categoria.id,
          descricao: categoria.descricao,
          valor: totalCategoria,
          percentual: totalReceitas > 0 ? (totalCategoria / totalReceitas) * 100 : 0
        };
      }).filter(c => c.valor > 0);
      
      // Retornar todos os dados para o dashboard
      return res.status(200).json({
        evolucaoMensal: dadosEvolucao,
        despesasPorCategoria: despesasCategorias,
        receitasPorCategoria: receitasCategorias,
        totais: {
          receitas: totalReceitas,
          despesas: totalDespesas,
          saldo: totalReceitas - totalDespesas
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Marcar uma movimentação como paga
  controller.marcarComoPago = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      
      // Verificar se a movimentação existe e pertence ao usuário
      const movimentacao = await Movimentacao.findOne({
        where: {
          id,
          usuario_id: usuarioId
        }
      });
      
      if (!movimentacao) {
        return res.status(404).json({ mensagem: 'Movimentação não encontrada' });
      }
      
      // Verificar se é uma despesa
      if (movimentacao.tipo !== 'despesa') {
        return res.status(400).json({ mensagem: 'Apenas despesas podem ser marcadas como pagas' });
      }
      
      // Obter a data atual para usar como data de pagamento
      const hoje = new Date();
      const dataPagamento = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Atualizar o status para 'pago' e definir a data de pagamento
      await movimentacao.update({ 
        status_pagamento: 'pago',
        data_pagamento: dataPagamento
      });
      
      return res.status(200).json({ 
        mensagem: 'Movimentação marcada como paga com sucesso',
        data_pagamento: dataPagamento
      });
    } catch (error) {
      console.error('Erro ao marcar movimentação como paga:', error);
      return res.status(500).json({ mensagem: 'Erro ao marcar movimentação como paga' });
    }
  };
  
  return controller;
};
