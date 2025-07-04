/**
 * Controlador de relatórios avançados
 * Permite gerar relatórios detalhados sobre as movimentações financeiras
 */

const { Op } = require('sequelize');
const logger = require('../utils/logger');

module.exports = (app) => {
  const controller = {};
  const { Movimentacao } = app.models;
  const { Categoria } = app.models;

  /**
   * Gera relatório de fluxo de caixa mensal
   */
  controller.fluxoCaixaMensal = async (req, res) => {
    try {
      const { ano } = req.query;
      const usuarioId = req.usuario.id;
      
      // Validar ano (padrão: ano atual)
      const anoFiltro = ano ? parseInt(ano) : new Date().getFullYear();
      
      logger.info(`Gerando relatório de fluxo de caixa para o ano ${anoFiltro}`);
      
      // Array com os 12 meses
      const meses = [];
      
      // Para cada mês do ano, buscar os totais
      for (let mes = 0; mes < 12; mes++) {
        const dataInicio = new Date(anoFiltro, mes, 1);
        const dataFim = new Date(anoFiltro, mes + 1, 0);
        
        // Formatar datas para YYYY-MM-DD
        const inicio = dataInicio.toISOString().split('T')[0];
        const fim = dataFim.toISOString().split('T')[0];
        
        // Buscar receitas
        const receitas = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'receita',
            data: {
              [Op.between]: [inicio, fim]
            },
            status_pagamento: {
              [Op.ne]: 'cancelado'
            }
          }
        }) || 0;
        
        // Buscar despesas
        const despesas = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'despesa',
            data: {
              [Op.between]: [inicio, fim]
            },
            status_pagamento: {
              [Op.ne]: 'cancelado'
            }
          }
        }) || 0;
        
        // Calcular saldo
        const saldo = receitas - despesas;
        
        // Adicionar dados do mês
        meses.push({
          mes: mes + 1,
          nome: obterNomeMes(mes),
          receitas,
          despesas,
          saldo
        });
      }
      
      // Calcular totais anuais
      const totalReceitas = meses.reduce((soma, mes) => soma + parseFloat(mes.receitas || 0), 0);
      const totalDespesas = meses.reduce((soma, mes) => soma + parseFloat(mes.despesas || 0), 0);
      const saldoAnual = totalReceitas - totalDespesas;
      
      // Retornar dados
      return res.json({
        ano: anoFiltro,
        meses,
        totais: {
          receitas: totalReceitas,
          despesas: totalDespesas,
          saldo: saldoAnual
        }
      });
      
    } catch (error) {
      logger.error(`Erro ao gerar relatório de fluxo de caixa: ${error.message}`, {
        stack: error.stack
      });
      return res.status(500).json({ message: 'Erro ao gerar relatório de fluxo de caixa' });
    }
  };
  
  /**
   * Gera relatório de gastos por categoria
   */
  controller.gastosPorCategoria = async (req, res) => {
    try {
      const { mes, ano } = req.query;
      const usuarioId = req.usuario.id;
      
      // Validar mês e ano (padrão: mês e ano atuais)
      const dataAtual = new Date();
      const mesFiltro = mes ? parseInt(mes) - 1 : dataAtual.getMonth();
      const anoFiltro = ano ? parseInt(ano) : dataAtual.getFullYear();
      
      logger.info(`Gerando relatório de gastos por categoria para ${mesFiltro + 1}/${anoFiltro}`);
      
      // Definir período
      const dataInicio = new Date(anoFiltro, mesFiltro, 1);
      const dataFim = new Date(anoFiltro, mesFiltro + 1, 0);
      
      // Formatar datas para YYYY-MM-DD
      const inicio = dataInicio.toISOString().split('T')[0];
      const fim = dataFim.toISOString().split('T')[0];
      
      // Buscar todas as categorias do usuário
      const categorias = await Categoria.findAll({
        where: { usuario_id: usuarioId },
        attributes: ['id', 'descricao']
      });
      
      // Para cada categoria, buscar o total de despesas
      const resultado = [];
      let totalGeral = 0;
      
      for (const categoria of categorias) {
        // Buscar total de despesas da categoria
        const total = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            categoria_id: categoria.id,
            tipo: 'despesa',
            data: {
              [Op.between]: [inicio, fim]
            },
            status_pagamento: {
              [Op.ne]: 'cancelado'
            }
          }
        }) || 0;
        
        if (total > 0) {
          resultado.push({
            categoria_id: categoria.id,
            descricao: categoria.descricao,
            total
          });
          
          totalGeral += parseFloat(total);
        }
      }
      
      // Calcular percentuais
      resultado.forEach(item => {
        item.percentual = totalGeral > 0 ? (item.total / totalGeral * 100).toFixed(2) : 0;
      });
      
      // Ordenar por valor (maior para menor)
      resultado.sort((a, b) => b.total - a.total);
      
      // Retornar dados
      return res.json({
        periodo: {
          mes: mesFiltro + 1,
          nome_mes: obterNomeMes(mesFiltro),
          ano: anoFiltro
        },
        total_geral: totalGeral,
        categorias: resultado
      });
      
    } catch (error) {
      logger.error(`Erro ao gerar relatório de gastos por categoria: ${error.message}`, {
        stack: error.stack
      });
      return res.status(500).json({ message: 'Erro ao gerar relatório de gastos por categoria' });
    }
  };

  /**
   * Gera relatório de evolução patrimonial
   */
  controller.evolucaoPatrimonial = async (req, res) => {
    try {
      const { periodo } = req.query;
      const usuarioId = req.usuario.id;
      
      // Definir período (3, 6, 12 ou 24 meses)
      const periodoMeses = parseInt(periodo) || 12;
      const dataAtual = new Date();
      const meses = [];
      
      logger.info(`Gerando relatório de evolução patrimonial para ${periodoMeses} meses`);
      
      // Para cada mês do período, calcular o patrimônio
      for (let i = periodoMeses - 1; i >= 0; i--) {
        const data = new Date(dataAtual);
        data.setMonth(data.getMonth() - i);
        
        const ano = data.getFullYear();
        const mes = data.getMonth();
        const ultimoDia = new Date(ano, mes + 1, 0).getDate();
        
        // Data de referência (último dia do mês)
        const dataReferencia = new Date(ano, mes, ultimoDia);
        const dataReferenciaStr = dataReferencia.toISOString().split('T')[0];
        
        // Total de receitas até a data de referência
        const totalReceitas = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'receita',
            data: {
              [Op.lte]: dataReferenciaStr
            },
            status_pagamento: {
              [Op.ne]: 'cancelado'
            }
          }
        }) || 0;
        
        // Total de despesas até a data de referência
        const totalDespesas = await Movimentacao.sum('valor', {
          where: {
            usuario_id: usuarioId,
            tipo: 'despesa',
            data: {
              [Op.lte]: dataReferenciaStr
            },
            status_pagamento: {
              [Op.ne]: 'cancelado'
            }
          }
        }) || 0;
        
        // Patrimônio líquido
        const patrimonio = totalReceitas - totalDespesas;
        
        meses.push({
          referencia: `${obterNomeMes(mes).substring(0, 3)}/${ano}`,
          mes: mes + 1,
          ano,
          patrimonio
        });
      }
      
      // Retornar dados
      return res.json({
        periodo: periodoMeses,
        evolucao: meses
      });
      
    } catch (error) {
      logger.error(`Erro ao gerar relatório de evolução patrimonial: ${error.message}`, {
        stack: error.stack
      });
      return res.status(500).json({ message: 'Erro ao gerar relatório de evolução patrimonial' });
    }
  };
  
  /**
   * Função auxiliar para obter nome do mês
   */
  function obterNomeMes(mes) {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mes];
  }

  return controller;
};
