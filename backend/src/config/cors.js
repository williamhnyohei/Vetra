/**
 * CORS Configuration
 * Cross-Origin Resource Sharing setup
 */

const cors = require('cors');
const logger = require('../utils/logger');

// Allowed origins
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://vetra.com',
  'https://www.vetra.com',
  'https://app.vetra.com',
];

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log blocked origins
    logger.logSecurity('CORS blocked origin', {
      origin,
      allowedOrigins,
    });
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// CORS middleware
const corsMiddleware = cors(corsOptions);

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      success: false,
      error: 'CORS policy violation',
      message: 'Origin not allowed',
    });
  } else {
    next(err);
  }
};

// CORS for specific routes
const createCorsForRoute = (route, options = {}) => {
  const routeCorsOptions = {
    ...corsOptions,
    ...options,
  };
  
  return cors(routeCorsOptions);
};

// CORS for API routes
const apiCors = createCorsForRoute('/api', {
  origin: allowedOrigins,
  credentials: true,
});

// CORS for WebSocket
const wsCors = createCorsForRoute('/socket.io', {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST'],
});

// CORS for health check
const healthCors = createCorsForRoute('/health', {
  origin: true, // Allow all origins for health checks
  credentials: false,
});

module.exports = {
  corsMiddleware,
  corsErrorHandler,
  apiCors,
  wsCors,
  healthCors,
  createCorsForRoute,
  allowedOrigins,
};
