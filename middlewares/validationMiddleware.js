/**
 * Middleware para validação de dados em requisições
 * Oferece funções para validar tipos comuns de dados do sistema
 */
const logger = require('../utils/logger');

module.exports = {
  /**
   * Valida os dados para criação/atualização de uma movimentação
   */
  validarMovimentacao: (req, res, next) => {
    try {
      const { descricao, valor, tipo, data, categoria_id } = req.body;
      const erros = [];

      // Validar descrição
      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        erros.push('Descrição é obrigatória e deve ser uma string não vazia');
      }
      
      // Validar valor
      if (valor === undefined || valor === null || isNaN(parseFloat(valor))) {
        erros.push('Valor é obrigatório e deve ser um número válido');
      }
      
      // Validar tipo
      if (!tipo || !['receita', 'despesa'].includes(tipo)) {
        erros.push('Tipo é obrigatório e deve ser "receita" ou "despesa"');
      }
      
      // Validar data
      if (!data) {
        erros.push('Data é obrigatória');
      } else {
        // Tenta validar se é uma data em formato válido
        const dataFormatada = new Date(data);
        if (isNaN(dataFormatada.getTime())) {
          erros.push('Data deve estar em formato válido');
        }
      }
      
      // Validar categoria_id
      if (!categoria_id || isNaN(parseInt(categoria_id))) {
        erros.push('Categoria é obrigatória e deve ser um ID válido');
      }
      
      // Se encontrou erros, retorna-os
      if (erros.length > 0) {
        logger.warn(`Validação falhou para movimentação`, { 
          erros, 
          usuarioId: req.usuario?.id || 'não autenticado',
          dados: req.body 
        });
        return res.status(400).json({ 
          message: 'Dados inválidos para movimentação', 
          erros 
        });
      }
      
      // Se chegou aqui, os dados estão ok
      next();
    } catch (error) {
      logger.error(`Erro na validação de movimentação`, { 
        error: error.message,
        stack: error.stack,
        dados: req.body
      });
      return res.status(500).json({ message: 'Erro na validação de dados' });
    }
  },
  
  /**
   * Valida os dados para criação/atualização de uma categoria
   */
  validarCategoria: (req, res, next) => {
    try {
      const { descricao } = req.body;
      const erros = [];
      
      if (!descricao || typeof descricao !== 'string' || descricao.trim().length === 0) {
        erros.push('Descrição da categoria é obrigatória');
      }
      
      if (erros.length > 0) {
        logger.warn(`Validação falhou para categoria`, { 
          erros, 
          usuarioId: req.usuario?.id || 'não autenticado',
          dados: req.body 
        });
        return res.status(400).json({ 
          message: 'Dados inválidos para categoria', 
          erros 
        });
      }
      
      next();
    } catch (error) {
      logger.error(`Erro na validação de categoria`, { 
        error: error.message,
        stack: error.stack,
        dados: req.body
      });
      return res.status(500).json({ message: 'Erro na validação de dados' });
    }
  }
};
