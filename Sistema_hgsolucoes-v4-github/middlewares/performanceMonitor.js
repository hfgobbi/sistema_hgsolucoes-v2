/**
 * Middleware para monitoramento de performance da aplicação
 * Registra o tempo de resposta de cada requisição e identifica gargalos
 */

const logger = require('../utils/logger');

// Limites de tempo de resposta (em ms)
const LIMITS = {
  ACCEPTABLE: 300,  // Aceitável
  WARNING: 1000,    // Alerta
  CRITICAL: 3000    // Crítico
};

// Armazena estatísticas para o relatório de performance
const stats = {
  requests: 0,
  totalTime: 0,
  slowest: {
    url: null,
    method: null,
    time: 0
  },
  routes: {}
};

/**
 * Middleware para medir o tempo de resposta de cada requisição
 */
const measureResponseTime = (req, res, next) => {
  // Marca o tempo de início da requisição
  const start = process.hrtime();
  
  // Adiciona o método para finalizar a medição
  res.on('finish', () => {
    // Calcula o tempo decorrido em milissegundos
    const elapsed = process.hrtime(start);
    const elapsedMs = (elapsed[0] * 1000) + (elapsed[1] / 1000000);
    const elapsedRounded = Math.round(elapsedMs);
    
    // Atualiza estatísticas
    updateStats(req, elapsedRounded);
    
    // Determina o nível de log com base no tempo de resposta
    let logLevel = 'debug';
    if (elapsedRounded > LIMITS.CRITICAL) {
      logLevel = 'error';
    } else if (elapsedRounded > LIMITS.WARNING) {
      logLevel = 'warn';
    } else if (elapsedRounded > LIMITS.ACCEPTABLE) {
      logLevel = 'info';
    }
    
    // Loga o tempo de resposta
    logger[logLevel](`${req.method} ${req.originalUrl || req.url} - ${elapsedRounded}ms`, {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: elapsedRounded,
      userId: req.usuario?.id || 'não autenticado'
    });
  });
  
  next();
};

/**
 * Atualiza as estatísticas de performance
 */
function updateStats(req, elapsedMs) {
  // Incrementa contadores globais
  stats.requests++;
  stats.totalTime += elapsedMs;
  
  // Verifica se é a requisição mais lenta
  if (elapsedMs > stats.slowest.time) {
    stats.slowest = {
      url: req.originalUrl || req.url,
      method: req.method,
      time: elapsedMs
    };
  }
  
  // Simplifica a URL para agrupar rotas semelhantes
  const route = simplifyRoute(req.originalUrl || req.url);
  
  // Atualiza estatísticas da rota
  if (!stats.routes[route]) {
    stats.routes[route] = {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      min: elapsedMs,
      max: elapsedMs
    };
  }
  
  const routeStats = stats.routes[route];
  routeStats.count++;
  routeStats.totalTime += elapsedMs;
  routeStats.averageTime = Math.round(routeStats.totalTime / routeStats.count);
  routeStats.min = Math.min(routeStats.min, elapsedMs);
  routeStats.max = Math.max(routeStats.max, elapsedMs);
}

/**
 * Simplifica uma URL para agrupar rotas semelhantes
 * Ex: /api/movimentacoes/123 -> /api/movimentacoes/:id
 */
function simplifyRoute(url) {
  return url
    .replace(/\/\d+(\/?)/g, '/:id$1') // Substitui IDs numéricos
    .replace(/\/[a-f0-9-]{36}(\/?)/g, '/:uuid$1') // Substitui UUIDs
    .replace(/\?.*$/, ''); // Remove query strings
}

/**
 * Gera um relatório de performance
 */
function generateReport() {
  // Se não houver requisições, retorna um relatório vazio
  if (stats.requests === 0) {
    return {
      message: 'Nenhuma requisição foi processada ainda',
      timestamp: new Date().toISOString()
    };
  }
  
  // Calcula estatísticas gerais
  const averageTime = Math.round(stats.totalTime / stats.requests);
  
  // Organiza as rotas por tempo médio (mais lentas primeiro)
  const sortedRoutes = Object.entries(stats.routes)
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.averageTime - a.averageTime);
  
  // Retorna o relatório
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: stats.requests,
      averageResponseTime: averageTime,
      slowestRequest: stats.slowest
    },
    routes: sortedRoutes.slice(0, 10) // Top 10 rotas mais lentas
  };
}

/**
 * Rota para obter relatório de performance
 */
function performanceReport(req, res) {
  const report = generateReport();
  res.json(report);
}

// Resetar estatísticas a cada 24 horas para evitar consumo de memória
setInterval(() => {
  const oldStats = { ...stats };
  
  // Log das estatísticas antes de resetar
  logger.info(`Relatório de performance diário`, { 
    totalRequests: oldStats.requests,
    averageTime: Math.round(oldStats.totalTime / oldStats.requests),
    slowestRequest: oldStats.slowest
  });
  
  // Reset das estatísticas
  stats.requests = 0;
  stats.totalTime = 0;
  stats.slowest = { url: null, method: null, time: 0 };
  stats.routes = {};
}, 24 * 60 * 60 * 1000);

module.exports = {
  measureResponseTime,
  performanceReport,
  generateReport
};
