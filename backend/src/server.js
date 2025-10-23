/**
 * Vetra Backend Server
 * Main entry point for the API server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { setupWebSocket } = require('./config/websocket');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const attestationRoutes = require('./routes/attestations');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const healthRoutes = require('./routes/health-simple');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Health check endpoint
app.use('/api/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/attestations', authenticateToken, attestationRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Vetra API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize server
async function startServer() {
  try {
    console.log('🔧 Starting server initialization...');
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 Port:', PORT);
    
    // Start server first (don't wait for DB/Redis connections)
    console.log('🔧 Setting up WebSocket...');
    const server = setupWebSocket(app);
    
    console.log('🔧 Starting HTTP server...');
    server.listen(PORT, () => {
      console.log(`🚀 Vetra API Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🚀 Vetra API Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

    // Try to connect to database (non-blocking)
    connectDatabase()
      .then(() => logger.info('Database connected successfully'))
      .catch((error) => logger.warn('Database connection failed:', error.message));

    // Try to connect to Redis (non-blocking) - disabled for now
    // connectRedis()
    //   .then(() => logger.info('Redis connected successfully'))
    //   .catch((error) => logger.warn('Redis connection failed:', error.message));

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
