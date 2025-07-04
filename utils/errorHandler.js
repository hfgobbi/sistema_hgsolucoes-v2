/**
 * Módulo de tratamento de erros centralizado
 * Fornece funções para padronizar erros e respostas HTTP
 */

const logger = require('./logger');

// Classes personalizadas de erro
class AppError extends Error {
  constructor(message, statusCode = 500, extras = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.extras = extras;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, extras = {}) {
    super(message, 400, extras);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado', extras = {}) {
    super(message, 404, extras);
  }
}

class AuthError extends AppError {
  constructor(message = 'Não autorizado', extras = {}) {
    super(message, 401, extras);
  }
}

// Middleware para tratamento centralizado de erros
const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';
  const extras = err.extras || {};
  
  // Log do erro
  if (statusCode >= 500) {
    logger.error(`${err.name || 'Error'}: ${message}`, {
      statusCode,
      extras,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      userId: req.usuario?.id || 'não autenticado'
    });
  } else {
    logger.warn(`${err.name || 'Error'}: ${message}`, {
      statusCode,
      extras,
      url: req.originalUrl,
      method: req.method,
      userId: req.usuario?.id || 'não autenticado'
    });
  }
  
  // Resposta para o cliente
  res.status(statusCode).json({
    error: {
      message,
      ...(statusCode >= 500 ? {} : extras), // Só envia extras se não for erro 500+
      statusCode
    }
  });
};

// Funções auxiliares para uso nos controladores
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  AuthError,
  errorMiddleware,
  asyncHandler
};
