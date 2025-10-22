/**
 * Health Check Routes
 * System health monitoring and status
 */

const express = require('express');
const { db } = require('../config/database');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    res.json(health);

  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const checks = {
      api: { status: 'healthy', responseTime: 0 },
      database: { status: 'unknown', responseTime: 0 },
      redis: { status: 'unknown', responseTime: 0 },
      solana: { status: 'unknown', responseTime: 0 },
    };

    const startTime = Date.now();

    // Check database
    try {
      const dbStart = Date.now();
      await db.raw('SELECT 1');
      checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      };
    } catch (error) {
      checks.database = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
    }

    // Check Redis
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      checks.redis = {
        status: 'healthy',
        responseTime: Date.now() - redisStart,
      };
    } catch (error) {
      checks.redis = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
    }

    // Check Solana connection
    try {
      const { Connection } = require('@solana/web3.js');
      const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      
      const solanaStart = Date.now();
      await connection.getSlot();
      checks.solana = {
        status: 'healthy',
        responseTime: Date.now() - solanaStart,
      };
    } catch (error) {
      checks.solana = {
        status: 'unhealthy',
        responseTime: 0,
        error: error.message,
      };
    }

    // API response time
    checks.api.responseTime = Date.now() - startTime;

    // Overall status
    const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
    const overallStatus = allHealthy ? 'healthy' : 'degraded';

    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
    });

  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test basic query
    await db.raw('SELECT 1');
    
    // Test table access
    const userCount = await db('users').count('* as count').first();
    const transactionCount = await db('transactions').count('* as count').first();
    
    const responseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      responseTime,
      tables: {
        users: parseInt(userCount.count),
        transactions: parseInt(transactionCount.count),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Database health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Redis health check
router.get('/redis', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test ping
    const pong = await redisClient.ping();
    
    // Test set/get
    const testKey = 'health:test';
    const testValue = Date.now().toString();
    
    await redisClient.setEx(testKey, 10, testValue);
    const retrievedValue = await redisClient.get(testKey);
    await redisClient.del(testKey);
    
    const responseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      responseTime,
      ping: pong,
      test: retrievedValue === testValue,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Redis health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Solana health check
router.get('/solana', async (req, res) => {
  try {
    const { Connection } = require('@solana/web3.js');
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    
    const startTime = Date.now();
    
    // Test connection
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    const version = await connection.getVersion();
    
    const responseTime = Date.now() - startTime;

    res.json({
      status: 'healthy',
      responseTime,
      slot,
      blockHeight,
      version: version['solana-core'],
      rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error('Solana health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    // Add database metrics
    try {
      const userCount = await db('users').count('* as count').first();
      const transactionCount = await db('transactions').count('* as count').first();
      const attestationCount = await db('attestations').count('* as count').first();
      
      metrics.database = {
        users: parseInt(userCount.count),
        transactions: parseInt(transactionCount.count),
        attestations: parseInt(attestationCount.count),
      };
    } catch (error) {
      metrics.database = { error: error.message };
    }

    // Add Redis metrics
    try {
      const info = await redisClient.info('memory');
      metrics.redis = {
        info: info.split('\n').filter(line => line.includes(':')).reduce((acc, line) => {
          const [key, value] = line.split(':');
          acc[key] = value;
          return acc;
        }, {}),
      };
    } catch (error) {
      metrics.redis = { error: error.message };
    }

    res.json(metrics);

  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
