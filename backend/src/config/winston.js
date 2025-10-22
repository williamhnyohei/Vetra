/**
 * Winston Configuration
 * Advanced logging setup
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for development
const devFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Custom format for production
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
  defaultMeta: { 
    service: 'vetra-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development' ? devFormat : prodFormat,
    }),
    
    // File transport for errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: prodFormat,
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: prodFormat,
    }),
    
    // File transport for access logs
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: prodFormat,
    }),
  ],
});

// Add request logging helper
logger.logRequest = (req, res, responseTime) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.userId,
  });
};

// Add error logging helper
logger.logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Add database query logging helper
logger.logQuery = (query, params, duration) => {
  logger.debug('Database Query', {
    query: query.toString(),
    params,
    duration: `${duration}ms`,
  });
};

// Add risk analysis logging helper
logger.logRiskAnalysis = (transactionId, riskScore, factors) => {
  logger.info('Risk Analysis', {
    transactionId,
    riskScore,
    riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
    factors,
  });
};

// Add attestation logging helper
logger.logAttestation = (attestationId, provider, riskScore, stakeAmount) => {
  logger.info('Attestation Created', {
    attestationId,
    provider,
    riskScore,
    stakeAmount,
  });
};

// Add authentication logging helper
logger.logAuth = (event, userId, details = {}) => {
  logger.info('Authentication Event', {
    event,
    userId,
    ...details,
  });
};

// Add WebSocket logging helper
logger.logWebSocket = (event, userId, details = {}) => {
  logger.info('WebSocket Event', {
    event,
    userId,
    ...details,
  });
};

// Add performance logging helper
logger.logPerformance = (operation, duration, details = {}) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...details,
  });
};

// Add security logging helper
logger.logSecurity = (event, details = {}) => {
  logger.warn('Security Event', {
    event,
    ...details,
  });
};

// Add business logic logging helper
logger.logBusiness = (event, details = {}) => {
  logger.info('Business Event', {
    event,
    ...details,
  });
};

module.exports = logger;
