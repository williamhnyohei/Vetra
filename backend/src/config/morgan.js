/**
 * Morgan Configuration
 * HTTP request logging setup
 */

const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom token for request ID
morgan.token('reqId', (req) => req.id || 'unknown');

// Custom token for user ID
morgan.token('userId', (req) => req.user?.userId || 'anonymous');

// Custom token for response time
morgan.token('responseTime', (req, res) => {
  if (!req._startTime) return '0';
  const ms = Date.now() - req._startTime;
  return `${ms}ms`;
});

// Custom token for request size
morgan.token('reqSize', (req) => {
  const contentLength = req.get('content-length');
  return contentLength ? `${contentLength}B` : '0B';
});

// Custom token for response size
morgan.token('resSize', (req, res) => {
  const contentLength = res.get('content-length');
  return contentLength ? `${contentLength}B` : '0B';
});

// Custom token for user agent
morgan.token('userAgent', (req) => req.get('user-agent') || 'unknown');

// Custom token for referer
morgan.token('referer', (req) => req.get('referer') || 'direct');

// Custom token for IP address
morgan.token('ip', (req) => req.ip || req.connection.remoteAddress || 'unknown');

// Custom format for development
const devFormat = ':reqId :method :url :status :responseTime :reqSize->:resSize :userId :ip :userAgent';

// Custom format for production
const prodFormat = ':reqId :method :url :status :responseTime :reqSize->:resSize :userId :ip :referer';

// Custom format for access logs
const accessFormat = ':reqId :method :url :status :responseTime :reqSize->:resSize :userId :ip :userAgent :referer';

// Custom format for error logs
const errorFormat = ':reqId :method :url :status :responseTime :reqSize->:resSize :userId :ip :userAgent :referer';

// Morgan middleware for development
const devMorgan = morgan(devFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
  skip: (req, res) => {
    // Skip logging for health checks
    return req.url === '/api/health' || req.url === '/health';
  },
});

// Morgan middleware for production
const prodMorgan = morgan(prodFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
  skip: (req, res) => {
    // Skip logging for health checks
    return req.url === '/api/health' || req.url === '/health';
  },
});

// Morgan middleware for access logs
const accessMorgan = morgan(accessFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
  skip: (req, res) => {
    // Skip logging for health checks
    return req.url === '/api/health' || req.url === '/health';
  },
});

// Morgan middleware for error logs
const errorMorgan = morgan(errorFormat, {
  stream: {
    write: (message) => {
      logger.error(message.trim());
    },
  },
  skip: (req, res) => {
    // Only log errors
    return res.statusCode < 400;
  },
});

// Custom Morgan middleware for specific routes
const createMorganForRoute = (route, format, options = {}) => {
  return morgan(format, {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
    skip: (req, res) => {
      // Skip logging for health checks
      if (req.url === '/api/health' || req.url === '/health') {
        return true;
      }
      
      // Skip logging for specific routes
      if (options.skipRoutes) {
        return options.skipRoutes.some(route => req.url.startsWith(route));
      }
      
      return false;
    },
  });
};

// Morgan middleware for API routes
const apiMorgan = createMorganForRoute('/api', devFormat, {
  skipRoutes: ['/api/health'],
});

// Morgan middleware for WebSocket
const wsMorgan = createMorganForRoute('/socket.io', devFormat, {
  skipRoutes: ['/socket.io/'],
});

// Morgan middleware for health check
const healthMorgan = createMorganForRoute('/health', devFormat, {
  skipRoutes: ['/health'],
});

// Custom Morgan middleware for authentication
const authMorgan = morgan(':reqId :method :url :status :responseTime :userId :ip', {
  stream: {
    write: (message) => {
      logger.logAuth('HTTP Request', message.trim());
    },
  },
  skip: (req, res) => {
    // Only log authentication routes
    return !req.url.startsWith('/api/auth');
  },
});

// Custom Morgan middleware for risk analysis
const analysisMorgan = morgan(':reqId :method :url :status :responseTime :userId :ip', {
  stream: {
    write: (message) => {
      logger.logBusiness('Risk Analysis Request', message.trim());
    },
  },
  skip: (req, res) => {
    // Only log risk analysis routes
    return !req.url.startsWith('/api/transactions/analyze');
  },
});

// Custom Morgan middleware for attestations
const attestationMorgan = morgan(':reqId :method :url :status :responseTime :userId :ip', {
  stream: {
    write: (message) => {
      logger.logBusiness('Attestation Request', message.trim());
    },
  },
  skip: (req, res) => {
    // Only log attestation routes
    return !req.url.startsWith('/api/attestations');
  },
});

module.exports = {
  devMorgan,
  prodMorgan,
  accessMorgan,
  errorMorgan,
  apiMorgan,
  wsMorgan,
  healthMorgan,
  authMorgan,
  analysisMorgan,
  attestationMorgan,
  createMorganForRoute,
};
