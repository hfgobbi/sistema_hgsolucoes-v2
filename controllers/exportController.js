/**
 * Controlador para exportação de dados
 * Permite exportar movimentações financeiras em diferentes formatos
 */

const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = (app) => {
  const controller = {};
  const { Movimentacao } = app.models;
  const { Categoria } = app.models;

  /**
   * Exporta movimentações para CSV
   */
  controller.exportarCSV = async (req, res) => {
    try {
      const { dataInicio, dataFim, tipo } = req.query;
      const usuarioId = req.usuario.id;
      
      logger.info(`Exportando movimentações para CSV`, { 
        usuario: usuarioId,
        dataInicio,
        dataFim, 
        tipo 
      });
      
      // Montar filtro de consulta
      const filtro = { usuario_id: usuarioId };
      
      // Filtrar por período, se especificado
      if (dataInicio || dataFim) {
        filtro.data = {};
        
        if (dataInicio) {
          filtro.data[Op.gte] = dataInicio;
        }
        
        if (dataFim) {
          filtro.data[Op.lte] = dataFim;
        }
      }
      
      // Filtrar por tipo, se especificado
      if (tipo && ['receita', 'despesa'].includes(tipo)) {
        filtro.tipo = tipo;
      }
      
      // Buscar movimentações
      const movimentacoes = await Movimentacao.findAll({
        where: filtro,
        include: [{
          model: Categoria,
          as: 'categoria',
          attributes: ['descricao']
        }],
        order: [['data', 'DESC']]
      });
      
      // Se não encontrou movimentações
      if (!movimentacoes.length) {
        return res.status(404).json({ message: 'Nenhuma movimentação encontrada para os filtros especificados' });
      }
      
      // Montar cabeçalho CSV
      let csv = 'Data,Descrição,Valor,Tipo,Categoria,Status,Data Vencimento,Data Pagamento,Observação\r\n';
      
      // Adicionar linhas de dados
      movimentacoes.forEach(mov => {
        const linha = [
          mov.data,
          `"${mov.descricao.replace(/"/g, '""')}"`,
          mov.valor,
          mov.tipo,
          mov.categoria ? `"${mov.categoria.descricao.replace(/"/g, '""')}"` : '',
          mov.status_pagamento,
          mov.data_vencimento || '',
          mov.data_pagamento || '',
          mov.observacao ? `"${mov.observacao.replace(/"/g, '""')}"` : ''
        ];
        
        csv += linha.join(',') + '\r\n';
      });
      
      // Configurar cabeçalhos da resposta
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=movimentacoes.csv');
      
      // Enviar CSV
      return res.send(csv);
      
    } catch (error) {
      logger.error(`Erro ao exportar para CSV: ${error.message}`, {
        stack: error.stack
      });
      return res.status(500).json({ message: 'Erro ao exportar movimentações' });
    }
  };
  
  /**
   * Exporta movimentações para JSON
   */
  controller.exportarJSON = async (req, res) => {
    try {
      const { dataInicio, dataFim, tipo } = req.query;
      const usuarioId = req.usuario.id;
      
      logger.info(`Exportando movimentações para JSON`, { 
        usuario: usuarioId,
        dataInicio,
        dataFim, 
        tipo 
      });
      
      // Montar filtro de consulta
      const filtro = { usuario_id: usuarioId };
      
      // Filtrar por período, se especificado
      if (dataInicio || dataFim) {
        filtro.data = {};
        
        if (dataInicio) {
          filtro.data[Op.gte] = dataInicio;
        }
        
        if (dataFim) {
          filtro.data[Op.lte] = dataFim;
        }
      }
      
      // Filtrar por tipo, se especificado
      if (tipo && ['receita', 'despesa'].includes(tipo)) {
        filtro.tipo = tipo;
      }
      
      // Buscar movimentações
      const movimentacoes = await Movimentacao.findAll({
        where: filtro,
        include: [{
          model: Categoria,
          as: 'categoria',
          attributes: ['descricao']
        }],
        order: [['data', 'DESC']]
      });
      
      // Se não encontrou movimentações
      if (!movimentacoes.length) {
        return res.status(404).json({ message: 'Nenhuma movimentação encontrada para os filtros especificados' });
      }
      
      // Formatar dados para JSON
      const dados = movimentacoes.map(mov => ({
        id: mov.id,
        data: mov.data,
        descricao: mov.descricao,
        valor: mov.valor,
        tipo: mov.tipo,
        categoria: mov.categoria ? mov.categoria.descricao : null,
        categoria_id: mov.categoria_id,
        status_pagamento: mov.status_pagamento,
        data_vencimento: mov.data_vencimento,
        data_pagamento: mov.data_pagamento,
        observacao: mov.observacao,
        tipo_frequencia: mov.tipo_frequencia,
        parcela_atual: mov.parcela_atual,
        parcelas_total: mov.parcelas_total
      }));
      
      // Configurar cabeçalhos da resposta
      res.header('Content-Type', 'application/json');
      res.header('Content-Disposition', 'attachment; filename=movimentacoes.json');
      
      // Enviar JSON
      return res.json({
        exportadoEm: new Date().toISOString(),
        filtros: {
          dataInicio: dataInicio || null,
          dataFim: dataFim || null,
          tipo: tipo || 'todos'
        },
        total: dados.length,
        movimentacoes: dados
      });
      
    } catch (error) {
      logger.error(`Erro ao exportar para JSON: ${error.message}`, {
        stack: error.stack
      });
      return res.status(500).json({ message: 'Erro ao exportar movimentações' });
    }
  };

  return controller;
};
