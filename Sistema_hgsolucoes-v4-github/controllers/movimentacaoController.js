module.exports = (app) => {
  const controller = {};
  const { Movimentacao } = app.models;
  const { Categoria } = app.models;
  const { Op } = require('sequelize');
  const logger = require('../utils/logger');
  
  // Função para normalizar datas (garantir formato YYYY-MM-DD)
  const normalizarData = (dataString) => {
    if (!dataString) return null;
    
    // Se já estiver no formato YYYY-MM-DD, retornar sem modificação
    if (typeof dataString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
      return dataString;
    }
    
    // Se já estiver no formato ISO, apenas retornar a parte da data sem alterar
    if (typeof dataString === 'string' && dataString.includes('T')) {
      return dataString.split('T')[0];
    }
    
    // Lidar com formatos de data brasileiros (DD/MM/YYYY)
    if (typeof dataString === 'string' && dataString.includes('/')) {
      const partes = dataString.split('/');
      if (partes.length === 3) {
        // Assumir formato DD/MM/YYYY
        let [dia, mes, ano] = partes;
        // Garantir que dia e mês tenham dois dígitos
        dia = dia.padStart(2, '0');
        mes = mes.padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
      }
    }
    
    // Preservar data original se já for um objeto Date
    if (dataString instanceof Date) {
      const ano = dataString.getFullYear();
      const mes = String(dataString.getMonth() + 1).padStart(2, '0');
      const dia = String(dataString.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }
    
    // Tentar converter para objeto Date e preservar o dia exato (sem ajuste de fuso)
    try {
      // Usar uma abordagem mais segura para manter a data exata
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return null;
      
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    } catch (error) {
      logger.error('Erro ao normalizar data:', error);
      return null;
    }
  };
  
  // Expor a função para uso no controller
  controller.normalizarData = normalizarData;
  
  // Listar todas as movimentações do usuário
  controller.listar = async (req, res) => {
    try {
      const usuarioId = req.usuario.id;
      
      // Obter parâmetros de filtro, se houver
      const { mes, ano, tipo, categoria_id, periodo, data_inicio, data_fim, por_vencimento } = req.query;
      
      logger.info('Recebida requisição para listar movimentações com parâmetros:', { 
        tipo, categoria_id, mes, ano, periodo, por_vencimento, 
        pagina: req.query.pagina, 
        limite: req.query.limite 
      });
      
      // Montar a query de filtro
      const filtro = { usuario_id: usuarioId };
      
      // Variável para armazenar o campo de data que será utilizado (data ou data_vencimento)
      const campoPeriodo = por_vencimento === 'true' ? 'data_vencimento' : 'data';
      
      // Função auxiliar para formatar a data como YYYY-MM-DD
      const formatarData = (date) => {
        return date.toISOString().split('T')[0];
      };
      
      // Aplicar filtro de período baseado no parâmetro 'periodo' (diário, semanal, mensal) ou datas específicas
      if (periodo) {
        const hoje = new Date();
        let dataInicio, dataFim;
        
        switch(periodo) {
          case 'diario': {
            // Filtro para o dia atual
            dataInicio = new Date(hoje);
            dataInicio.setHours(0, 0, 0, 0); // Início do dia
            
            dataFim = new Date(hoje);
            dataFim.setHours(23, 59, 59, 999); // Fim do dia
            break;
          }
          case 'semanal': {
            // Filtro para a semana atual (Domingo a Sábado)
            const diaSemana = hoje.getDay(); // 0 = Domingo, 6 = Sábado
            dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - diaSemana); // Ajusta para o domingo
            dataInicio.setHours(0, 0, 0, 0); // Início do dia
            
            dataFim = new Date(dataInicio);
            dataFim.setDate(dataInicio.getDate() + 6); // Sábado
            dataFim.setHours(23, 59, 59, 999); // Fim do dia
            break;
          }
          case 'mensal': {
            // Filtro para o mês atual
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1); // Primeiro dia do mês atual
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // Último dia do mês atual
            dataFim.setHours(23, 59, 59, 999); // Fim do dia
            break;
          }
          default:
            // Período inválido, não aplica filtro de data
            break;
        }
        
        if (dataInicio && dataFim) {
          logger.debug(`Aplicando filtro de período: ${periodo}`, {
            dataInicio: formatarData(dataInicio),
            dataFim: formatarData(dataFim),
            campoPeriodo
          });
          
          filtro[campoPeriodo] = {
            [Op.gte]: formatarData(dataInicio),
            [Op.lte]: formatarData(dataFim)
          };
        }
      } 
      // Filtrar por mês e ano se fornecidos (e período não fornecido)
      else if (mes && ano) {
        // Validar e converter parâmetros
        const mesInt = parseInt(mes, 10);
        const anoInt = parseInt(ano, 10);
        
        if (isNaN(mesInt) || isNaN(anoInt) || mesInt < 1 || mesInt > 12) {
          logger.warn(`Parâmetros de mês/ano inválidos: mes=${mes}, ano=${ano}`);
          return res.status(400).json({ message: 'Parâmetros de mês/ano inválidos' });
        }
        
        // Criar datas para o início e fim do mês
        const dataInicio = new Date(anoInt, mesInt - 1, 1);
        const dataFim = new Date(anoInt, mesInt, 0);
        dataFim.setHours(23, 59, 59, 999);
        
        filtro[campoPeriodo] = {
          [Op.between]: [formatarData(dataInicio), formatarData(dataFim)]
        };
      } else if (data_inicio && data_fim) {
        // Filtrar por intervalo de datas específico
        filtro[campoPeriodo] = {
          [Op.between]: [data_inicio, data_fim]
        };
      }

      // Excluir movimentações canceladas a menos que seja explicitamente solicitado
      const incluirCancelados = req.query.incluir_cancelados === 'true';
      if (!incluirCancelados) {
        filtro.status_pagamento = {
          [Op.notIn]: ['cancelado']
        };
      }

      // Filtrar por tipo se fornecido
      if (tipo && ['receita', 'despesa'].includes(tipo)) {
        filtro.tipo = tipo;
        logger.info(`Filtrando por tipo: ${tipo}`);
      } else if (tipo) {
        logger.warn(`Tipo inválido ignorado: ${tipo}. Valores válidos: receita, despesa`);
      } else {
        logger.info('Nenhum filtro de tipo aplicado - exibindo receitas e despesas');
      }

      // Filtrar por categoria se fornecido
      if (categoria_id) {
        filtro.categoria_id = categoria_id;
      }

      // Obter parâmetros de paginação
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = parseInt(req.query.limite) || 20;
      const offset = (pagina - 1) * limite;

      logger.debug(`Consultando movimentações com filtros:`, {
        filtro,
        pagina,
        limite,
        offset
      });

      // Buscar total de registros com o filtro
      const totalRegistros = await Movimentacao.count({
        where: filtro
      });

      // Calcular total de páginas
      const totalPaginas = Math.ceil(totalRegistros / limite);

      // Buscar as movimentações com paginação
      const movimentacoes = await Movimentacao.findAll({
        where: filtro,
        include: [{ model: Categoria, as: 'categoria' }],
        order: [[campoPeriodo, 'DESC']],
        limit: limite,
        offset: offset
      });

      // Analisar e logar os tipos de movimentações encontradas
      const tiposEncontrados = {};
      movimentacoes.forEach(mov => {
        if (!tiposEncontrados[mov.tipo]) {
          tiposEncontrados[mov.tipo] = 1;
        } else {
          tiposEncontrados[mov.tipo]++;
        }
      });
      
      logger.info(`${movimentacoes.length} movimentações encontradas com os filtros aplicados (página ${pagina}/${totalPaginas})`);
      logger.info(`Distribuição por tipo: ${JSON.stringify(tiposEncontrados)}`);
      
      // Verificar se há despesas no resultado
      const temDespesas = movimentacoes.some(mov => mov.tipo === 'despesa');
      if (!temDespesas && !tipo) {
        logger.warn('ATENÇÃO: Nenhuma despesa encontrada mesmo sem filtro de tipo. Pode indicar problema no banco ou nos filtros.');
      }
      
      const resposta = {
        resultados: movimentacoes,
        total: totalRegistros,
        pagina,
        limite,
        totalPaginas
      };
      
      return res.status(200).json(resposta);
    } catch (error) {
      logger.error('Erro ao listar movimentações:', { error: error.message, stack: error.stack });
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
      const { descricao, valor, tipo, data, categoria_id, observacao, tipo_frequencia, status_pagamento, data_vencimento, parcelas_total } = req.body;
      const usuarioId = req.usuario.id;

      logger.info(`Nova movimentação sendo adicionada por usuário ID ${usuarioId}`, {
        descricao,
        valor,
        tipo,
        data,
        categoria_id,
        tipo_frequencia,
        parcelas_total
      });

      // Validar campos obrigatórios
      if (!descricao || !valor || !tipo || !data || !categoria_id) {
        logger.warn(`Tentativa de adicionar movimentação com campos obrigatórios faltando`, {
          usuarioId,
          camposFaltantes: [
            !descricao ? 'descricao' : null,
            !valor ? 'valor' : null,
            !tipo ? 'tipo' : null,
            !data ? 'data' : null,
            !categoria_id ? 'categoria_id' : null
          ].filter(Boolean)
        });
        return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
      }

      // Verificar se o tipo é válido
      if (!['receita', 'despesa'].includes(tipo)) {
        return res.status(400).json({
          mensagem: "Tipo de movimentação inválido. Use 'receita' ou 'despesa'."
        });
      }

      // Verificar se a categoria existe e pertence ao usuário
      const categoria = await Categoria.findOne({
        where: {
          id: categoria_id,
          usuario_id: usuarioId
        }
      });

      if (!categoria) {
        return res.status(400).json({
          mensagem: "Categoria não encontrada ou não pertence ao usuário"
        });
      }

      // Garantir que status_pagamento seja válido
      const statusPagamento = req.body.status_pagamento || 'pendente';
      if (!['pago', 'pendente', 'a_pagar', 'vencido', 'cancelado'].includes(statusPagamento)) {
        req.body.status_pagamento = 'pendente';
      }

      // Normalizar a data para garantir que fique na competência correta
      logger.debug(`Normalizando data: ${data}`);
      const dataNormalizada = normalizarData(data);
      logger.debug(`Data normalizada: ${dataNormalizada}`);

      // Verificar se a data de vencimento foi informada
      let dataVencimentoNormalizada = data_vencimento ? normalizarData(data_vencimento) : dataNormalizada;

      // Definir data de pagamento se estiver marcado como pago
      let dataPagamento = null;
      if (status_pagamento === 'pago') {
        dataPagamento = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
        logger.debug(`Definida data de pagamento automática: ${dataPagamento}`);
      }

      // Verificar se é uma movimentação parcelada
      if (tipo_frequencia === 'parcelada' && parcelas_total && parcelas_total > 1) {
        logger.info(`Criando movimentação parcelada com ${parcelas_total} parcelas`);

        try {
          // Criar a primeira parcela (parcela pai)
          const primeiraMovimentacao = await Movimentacao.create({
            descricao: `${descricao} (1/${parcelas_total})`,
            valor,
            tipo,
            data: dataNormalizada,
            data_vencimento: dataVencimentoNormalizada,
            categoria_id,
            observacao,
            tipo_frequencia: 'parcelada',
            status_pagamento: status_pagamento || 'pendente',
            data_pagamento: dataPagamento,
            parcelas_total,
            parcela_atual: 1,
            usuario_id: usuarioId
          });

          logger.info(`Primeira parcela criada com sucesso: ID ${primeiraMovimentacao.id}`);

          // Array para armazenar todas as movimentações criadas
          const todasMovimentacoes = [primeiraMovimentacao];

          // Criar as demais parcelas
          for (let i = 1; i < parcelas_total; i++) {
            // Calcular a data de competência da próxima parcela (mês a mês)
            // Calcular a data de competência da próxima parcela (mês a mês)
            // Usar método seguro que preserva o dia correto
            const partes = dataNormalizada.split('-');
            const ano = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10);
            const dia = parseInt(partes[2], 10);
            
            // Criar data usando UTC para evitar problemas de fuso horário
            const dataCompetencia = new Date(Date.UTC(ano, mes - 1 + i, dia));
            const novaDataCompetencia = `${dataCompetencia.getUTCFullYear()}-${String(dataCompetencia.getUTCMonth() + 1).padStart(2, '0')}-${String(dataCompetencia.getUTCDate()).padStart(2, '0')}`;
            
            // Calcular a data de vencimento da próxima parcela
            // Usar método seguro que preserva o dia correto, igual à data de competência
            const partesVenc = dataVencimentoNormalizada.split('-');
            const anoVenc = parseInt(partesVenc[0], 10);
            const mesVenc = parseInt(partesVenc[1], 10);
            const diaVenc = parseInt(partesVenc[2], 10);
            
            // Criar data usando UTC para evitar problemas de fuso horário
            const dataVencimento = new Date(Date.UTC(anoVenc, mesVenc - 1 + i, diaVenc));
            const novaDataVencimento = `${dataVencimento.getUTCFullYear()}-${String(dataVencimento.getUTCMonth() + 1).padStart(2, '0')}-${String(dataVencimento.getUTCDate()).padStart(2, '0')}`;

            logger.debug(`Criando parcela ${i + 1}/${parcelas_total} com data de competência: ${novaDataCompetencia} e vencimento: ${novaDataVencimento}`);
            
            // Criar a parcela com data de competência correspondente ao seu mês
            const parcela = await Movimentacao.create({
              descricao: `${descricao} (${i + 1}/${parcelas_total})`,
              valor,
              tipo,
              data: novaDataCompetencia, // Cada parcela tem sua data de competência no mês correspondente
              data_vencimento: novaDataVencimento, // Incrementa mensalmente
              categoria_id,
              observacao,
              tipo_frequencia: 'parcelada',
              status_pagamento: 'pendente', // Parcelas futuras sempre iniciam como pendentes
              parcelas_total,
              parcela_atual: i + 1,
              movimentacao_pai_id: primeiraMovimentacao.id, // Vincula à primeira parcela
              usuario_id: usuarioId
            });

            logger.debug(`Parcela ${i + 1}/${parcelas_total} criada com sucesso: ID ${parcela.id}`);
            todasMovimentacoes.push(parcela);
          }

          logger.info(`Todas as ${parcelas_total} parcelas criadas com sucesso para a movimentação parcelada ID ${primeiraMovimentacao.id}`);

          return res.status(201).json({
            mensagem: `Movimentação parcelada criada com sucesso em ${parcelas_total} parcelas`,
            parcelas: todasMovimentacoes
          });

        } catch (error) {
          logger.error(`Erro ao criar movimentação parcelada: ${error.message}`, {
            error: error.stack,
            dados: { descricao, tipo, valor, parcelas_total }
          });
          return res.status(500).json({ message: 'Erro ao criar movimentação parcelada' });
        }
      } else {
        // É uma movimentação normal (não parcelada)
        try {
          const novaMovimentacao = await Movimentacao.create({
            descricao,
            valor,
            tipo,
            data: dataNormalizada,
            data_vencimento: dataVencimentoNormalizada,
            categoria_id,
            observacao,
            tipo_frequencia: tipo_frequencia || 'unica',
            status_pagamento: status_pagamento || 'pendente',
            data_pagamento: dataPagamento,
            usuario_id: usuarioId
          });

          logger.info(`Movimentação criada com sucesso: ID ${novaMovimentacao.id}`, {
            tipo_frequencia: novaMovimentacao.tipo_frequencia,
            status_pagamento: novaMovimentacao.status_pagamento
          });

          return res.status(201).json(novaMovimentacao);
        } catch (error) {
          logger.error(`Erro ao criar movimentação: ${error.message}`, {
            error: error.stack,
            dados: { descricao, tipo, valor, dataNormalizada }
          });
          return res.status(500).json({ message: 'Erro interno do servidor' });
        }
      }
    } catch (error) {
      logger.error(`Erro ao adicionar movimentação:`, { errorMessage: error.message, stack: error.stack });
      console.error('Erro ao adicionar movimentação:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };

  // A função normalizarData já está definida no início do arquivo

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
        novaDePagamento = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      } else if (status_pagamento && status_pagamento !== 'pago' && movimentacao.data_pagamento) {
        // Se já tiver data de pagamento e não estiver mais marcado como pago, limpar a data
        novaDePagamento = null;
      } else if (data_pagamento) {
        // Se tiver uma data de pagamento explícita no request, usar essa
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
      const { mes, ano } = req.query;

      // Validar parâmetros
      const dataAtual = new Date();
      const mesFiltro = mes ? parseInt(mes) : dataAtual.getMonth() + 1;
      const anoFiltro = ano ? parseInt(ano) : dataAtual.getFullYear();

      // Definir período do mês
      const dataInicio = new Date(anoFiltro, mesFiltro - 1, 1);
      const dataFim = new Date(anoFiltro, mesFiltro, 0);

      const inicio = dataInicio.toISOString().split('T')[0];
      const fim = dataFim.toISOString().split('T')[0];

      // Array com os meses do ano para evolução mensal
      const meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      
      // Dados para gráfico de linha (evolução mensal)
      const dadosEvolucao = await Promise.all(meses.map(async (mesDado) => {
        const inicioMes = new Date(anoFiltro, parseInt(mesDado) - 1, 1);
        const fimMes = new Date(anoFiltro, parseInt(mesDado), 0);
        const inicioStr = inicioMes.toISOString().split('T')[0];
        const fimStr = fimMes.toISOString().split('T')[0];
        
        // Receitas do mês, excluindo canceladas
        const receitasMes = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'receita',
            data: {
              [Op.between]: [inicioStr, fimStr]
            },
            status_pagamento: {
              [Op.notIn]: ['cancelado']
            }
          }
        }) || 0;
        
        // Despesas do mês, excluindo canceladas
        const despesasMes = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'despesa',
            data: {
              [Op.between]: [inicioStr, fimStr]
            },
            status_pagamento: {
              [Op.notIn]: ['cancelado']
            }
          }
        }) || 0;
        
        return {
          mes: mesDado,
          receitas: receitasMes,
          despesas: despesasMes,
          saldo: receitasMes - despesasMes
        };
      }));
      
      // Total de receitas no mês atual, excluindo canceladas
      const totalReceitas = await Movimentacao.sum('valor', {
        where: {
          usuario_id: usuarioId,
          tipo: 'receita',
          data: { [Op.between]: [inicio, fim] },
          status_pagamento: {
            [Op.notIn]: ['cancelado']
          }
        }
      }) || 0;

      // Total de despesas no mês atual, excluindo canceladas
      const totalDespesas = await Movimentacao.sum('valor', {
        where: {
          usuario_id: usuarioId,
          tipo: 'despesa',
          data: { [Op.between]: [inicio, fim] },
          status_pagamento: {
            [Op.notIn]: ['cancelado']
          }
        }
      }) || 0;

      // Dados para gráfico de pizza (despesas por categoria)
      const despesasPorCategoria = await Categoria.findAll({
        where: { usuario_id: usuarioId },
        include: [{
          model: Movimentacao,
          as: 'movimentacoes',
          where: {
            tipo: 'despesa',
            data: { [Op.between]: [inicio, fim] },
            status_pagamento: {
              [Op.notIn]: ['cancelado']
            }
          },
          required: false
        }],
        attributes: ['id', 'descricao']
      });

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
            data: { [Op.between]: [inicio, fim] },
            status_pagamento: {
              [Op.notIn]: ['cancelado']
            }
          },
          required: false
        }],
        attributes: ['id', 'descricao']
      });
      
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
