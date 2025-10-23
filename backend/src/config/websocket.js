/**
 * WebSocket Configuration
 * Real-time notifications and communication
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
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

  // Authentication middleware (simplified for now)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        // Allow connection without auth for now
        socket.userId = 'guest';
        socket.user = {
          id: 'guest',
          email: 'guest@vetra.com',
          name: 'Guest User',
          subscription_plan: 'free',
        };
        return next();
      }

      // TODO: Implement proper JWT verification when DB is available
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

    // Handle settings updates (simplified for now)
    socket.on('update-settings', async (data) => {
      try {
        const { settings } = data;

        // TODO: Update user settings in database when DB is available
        logger.info('Settings update requested', { userId: socket.userId, settings });

        // Emit settings updated
        socket.emit('settings-updated', {
          settings,
          timestamp: new Date().toISOString(),
        });

      } catch (error) {
        logger.error('WebSocket update settings error:', error);
        socket.emit('settings-error', {
          error: 'Settings update failed',
        });
      }
    });

    // Handle subscription updates (simplified for now)
    socket.on('subscription-updated', async (data) => {
      try {
        const { plan } = data;

        // TODO: Update user subscription in database when DB is available
        logger.info('Subscription update requested', { userId: socket.userId, plan });

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
