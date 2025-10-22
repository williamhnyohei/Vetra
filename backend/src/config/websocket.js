/**
 * WebSocket Configuration
 * Real-time notifications and communication
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { db } = require('./database');
const { cache } = require('./redis');
const logger = require('../utils/logger');

let io;

/**
 * Setup WebSocket server
 */
function setupWebSocket(app) {
  const http = require('http');
  const server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: process.env.WS_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db('users').where({ id: decoded.userId }).first();

      if (!user || !user.is_active) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user.id;
      socket.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_plan: user.subscription_plan,
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    logger.info('WebSocket connection established', {
      userId: socket.userId,
      socketId: socket.id,
    });

    // Join user room
    socket.join(`user:${socket.userId}`);

    // Join subscription-based rooms
    if (socket.user.subscription_plan === 'pro') {
      socket.join('pro-users');
    }

    // Handle risk analysis requests
    socket.on('analyze-transaction', async (data) => {
      try {
        const { transactionData } = data;
        
        // Emit analysis start
        socket.emit('analysis-started', {
          transactionId: transactionData.signature || 'pending',
        });

        // Simulate analysis (in production, this would call the actual service)
        const analysis = {
          score: Math.floor(Math.random() * 100),
          level: 'medium',
          reasons: ['Analysis in progress...'],
        };

        // Emit analysis result
        socket.emit('analysis-complete', {
          transactionId: transactionData.signature || 'pending',
          analysis,
        });

        // Broadcast to other users if high risk
        if (analysis.score >= 70) {
          socket.to('pro-users').emit('high-risk-alert', {
            transactionId: transactionData.signature || 'pending',
            analysis,
            timestamp: new Date().toISOString(),
          });
        }

      } catch (error) {
        logger.error('WebSocket analyze transaction error:', error);
        socket.emit('analysis-error', {
          error: 'Analysis failed',
          transactionId: data.transactionData?.signature || 'unknown',
        });
      }
    });

    // Handle attestation voting
    socket.on('vote-attestation', async (data) => {
      try {
        const { attestationId, vote, stakeAmount } = data;

        // Emit vote confirmation
        socket.emit('vote-confirmed', {
          attestationId,
          vote,
          stakeAmount,
          timestamp: new Date().toISOString(),
        });

        // Broadcast vote to other users
        socket.to('pro-users').emit('attestation-voted', {
          attestationId,
          vote,
          voter: socket.user.name,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        logger.error('WebSocket vote attestation error:', error);
        socket.emit('vote-error', {
          error: 'Vote failed',
          attestationId: data.attestationId,
        });
      }
    });

    // Handle settings updates
    socket.on('update-settings', async (data) => {
      try {
        const { settings } = data;

        // Update user settings in database
        await db('users')
          .where({ id: socket.userId })
          .update({
            settings: settings,
            updated_at: new Date(),
          });

        // Emit settings updated
        socket.emit('settings-updated', {
          settings,
          timestamp: new Date().toISOString(),
        });

        // Clear user cache
        await cache.del(`user:${socket.userId}`);

      } catch (error) {
        logger.error('WebSocket update settings error:', error);
        socket.emit('settings-error', {
          error: 'Settings update failed',
        });
      }
    });

    // Handle subscription updates
    socket.on('subscription-updated', async (data) => {
      try {
        const { plan } = data;

        // Update user subscription
        await db('users')
          .where({ id: socket.userId })
          .update({
            subscription_plan: plan,
            updated_at: new Date(),
          });

        // Update socket user data
        socket.user.subscription_plan = plan;

        // Join/leave subscription rooms
        if (plan === 'pro') {
          socket.join('pro-users');
        } else {
          socket.leave('pro-users');
        }

        // Emit subscription updated
        socket.emit('subscription-updated', {
          plan,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        logger.error('WebSocket subscription update error:', error);
        socket.emit('subscription-error', {
          error: 'Subscription update failed',
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket connection closed', {
        userId: socket.userId,
        socketId: socket.id,
        reason,
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });

  return server;
}

/**
 * Broadcast notification to all users
 */
function broadcastNotification(type, data) {
  if (io) {
    io.emit('notification', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Send notification to specific user
 */
function sendUserNotification(userId, type, data) {
  if (io) {
    io.to(`user:${userId}`).emit('notification', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Send notification to Pro users
 */
function sendProNotification(type, data) {
  if (io) {
    io.to('pro-users').emit('pro-notification', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Broadcast risk alert
 */
function broadcastRiskAlert(transactionId, analysis) {
  if (io) {
    io.emit('risk-alert', {
      transactionId,
      analysis,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Broadcast attestation update
 */
function broadcastAttestationUpdate(attestation) {
  if (io) {
    io.emit('attestation-update', {
      attestation,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get connected users count
 */
function getConnectedUsersCount() {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
}

/**
 * Get connected users by subscription
 */
async function getConnectedUsersStats() {
  if (!io) return { total: 0, pro: 0, free: 0 };

  const sockets = await io.fetchSockets();
  const stats = { total: sockets.length, pro: 0, free: 0 };

  sockets.forEach(socket => {
    if (socket.user?.subscription_plan === 'pro') {
      stats.pro++;
    } else {
      stats.free++;
    }
  });

  return stats;
}

module.exports = {
  setupWebSocket,
  broadcastNotification,
  sendUserNotification,
  sendProNotification,
  broadcastRiskAlert,
  broadcastAttestationUpdate,
  getConnectedUsersCount,
  getConnectedUsersStats,
};
