/**
 * Rate Limiting Configuration
 * Advanced rate limiting setup
 */

const rateLimit = require('express-rate-limit');
const { cache } = require('./redis');
const logger = require('../utils/logger');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60,
    });
  },
});

// Risk analysis rate limiting
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 analysis requests per minute
  message: {
    success: false,
    error: 'Too many risk analysis requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('Analysis rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many risk analysis requests, please try again later.',
      retryAfter: 60,
    });
  },
});

// Attestation rate limiting
const attestationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 attestation requests per minute
  message: {
    success: false,
    error: 'Too many attestation requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('Attestation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many attestation requests, please try again later.',
      retryAfter: 60,
    });
  },
});

// WebSocket rate limiting
const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 WebSocket events per minute
  message: {
    success: false,
    error: 'Too many WebSocket events, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.logSecurity('WebSocket rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many WebSocket events, please try again later.',
      retryAfter: 60,
    });
  },
});

// Custom rate limiter for specific endpoints
const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.logSecurity('Custom rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        windowMs,
        max,
      });
      
      res.status(429).json({
        success: false,
        error: message.error || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// Rate limiter for file uploads
const uploadLimiter = createCustomLimiter(
  60 * 1000, // 1 minute
  3, // 3 uploads per minute
  {
    success: false,
    error: 'Too many file uploads, please try again later.',
  }
);

// Rate limiter for password reset
const passwordResetLimiter = createCustomLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 password reset attempts per hour
  {
    success: false,
    error: 'Too many password reset attempts, please try again later.',
  }
);

// Rate limiter for email verification
const emailVerificationLimiter = createCustomLimiter(
  60 * 1000, // 1 minute
  1, // 1 email verification per minute
  {
    success: false,
    error: 'Too many email verification requests, please try again later.',
  }
);

module.exports = {
  generalLimiter,
  authLimiter,
  analysisLimiter,
  attestationLimiter,
  wsLimiter,
  uploadLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  createCustomLimiter,
};
