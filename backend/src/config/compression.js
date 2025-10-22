/**
 * Compression Configuration
 * Response compression setup
 */

const compression = require('compression');
const logger = require('../utils/logger');

// Compression options
const compressionOptions = {
  level: 6, // Compression level (1-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress if response is already compressed
    if (res.getHeader('content-encoding')) {
      return false;
    }
    
    // Don't compress if response is too small
    const contentLength = res.getHeader('content-length');
    if (contentLength && parseInt(contentLength) < 1024) {
      return false;
    }
    
    return compression.filter(req, res);
  },
};

// Compression middleware
const compressionMiddleware = compression(compressionOptions);

// Compression for specific routes
const createCompressionForRoute = (route, options = {}) => {
  const routeOptions = {
    ...compressionOptions,
    ...options,
  };
  
  return compression(routeOptions);
};

// Compression for API routes
const apiCompression = createCompressionForRoute('/api', {
  level: 6,
  threshold: 1024,
});

// Compression for static files
const staticCompression = createCompressionForRoute('/static', {
  level: 9,
  threshold: 512,
});

module.exports = {
  compressionMiddleware,
  apiCompression,
  staticCompression,
  createCompressionForRoute,
};
