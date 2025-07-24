/**
 * Middleware de segurança para proteger a aplicação contra ataques comuns
 */
const logger = require('../utils/logger');

module.exports = {
  /**
   * Limita o tamanho das requisições para evitar ataques de DOS
   */
  limitarTamanhoRequisicao: (req, res, next) => {
    const MAX_SIZE = 1024 * 1024; // 1MB
    
    if (req.headers['content-length'] > MAX_SIZE) {
      logger.warn(`Tentativa de requisição com tamanho excessivo`, {
        tamanho: req.headers['content-length'],
        ip: req.ip,
        url: req.originalUrl
      });
      
      return res.status(413).json({
        error: {
          message: 'Requisição muito grande',
          statusCode: 413
        }
      });
    }
    
    next();
  },
  
  /**
   * Adiciona headers de segurança básicos
   */
  adicionarHeadersSeguranca: (req, res, next) => {
    // Evita que o navegador "adivinhe" o tipo MIME
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Habilita a proteção XSS em navegadores antigos
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Evita cliques em outras páginas
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Controle básico de CORS
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    next();
  },
  
  /**
   * Sanitização básica de entrada para evitar injeções
   */
  sanitizarEntrada: (req, res, next) => {
    // Função simples para sanitizar strings
    const sanitize = (str) => {
      if (typeof str !== 'string') return str;
      // Remove caracteres potencialmente perigosos
      return str.replace(/[<>]/g, '');
    };
    
    // Sanitiza corpo da requisição
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitize(req.body[key]);
        }
      });
    }
    
    // Sanitiza parâmetros de URL
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        if (typeof req.params[key] === 'string') {
          req.params[key] = sanitize(req.params[key]);
        }
      });
    }
    
    // Sanitiza query strings
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitize(req.query[key]);
        }
      });
    }
    
    next();
  },
};
