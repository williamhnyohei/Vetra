/**
 * Transaction Routes
 * Handles transaction analysis and history
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { cache } = require('../config/redis');
const { analyzeTransactionWithMultiAgent } = require('../services/multiAgentRiskAnalyzer');
const { optionalAuth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Analyze transaction
router.post('/analyze', optionalAuth, [
  body('transactionData').isObject().notEmpty(),
  body('transactionData.signature').optional().isString(),
  body('transactionData.type').isString().notEmpty(),
  body('transactionData.from').isString().notEmpty(),
  body('transactionData.to').isString().notEmpty(),
  body('transactionData.amount').isString().notEmpty(),
  body('transactionData.token').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { transactionData } = req.body;
    const userId = req.user ? req.user.userId : null;

    // Check cache first
    const cacheKey = `analysis:${transactionData.signature || transactionData.from + transactionData.to + transactionData.amount}`;
    const cachedAnalysis = await cache.get(cacheKey);
    
    if (cachedAnalysis) {
      return res.json({
        success: true,
        analysis: cachedAnalysis,
        cached: true,
      });
    }

    // Perform risk analysis using Multi-Agent System
    const analysis = await analyzeTransactionWithMultiAgent(transactionData, {
      userId,
      analysisDepth: 'standard',
      includeOnChainData: true,
      includeMlPrediction: true,
    });

    // Cache the analysis
    await cache.set(cacheKey, analysis, 3600); // 1 hour

    logger.info('🔄 Attempting to save transaction to database...', {
      userId: userId || 'NULL',
      type: transactionData.type,
      from: transactionData.from,
      to: transactionData.to,
      amount: transactionData.amount,
      riskScore: analysis.score,
      riskLevel: analysis.level,
    });

    // SEMPRE salva no banco (mesmo sem autenticação)
    // Se não tiver userId, salva como NULL (transação anônima)
    const [transaction] = await db('transactions')
      .insert({
        user_id: userId || null, // Permite NULL para usuários não autenticados
        signature: transactionData.signature,
        transaction_hash: transactionData.signature,
        type: transactionData.type,
        from_address: transactionData.from,
        to_address: transactionData.to,
        amount: transactionData.amount,
        token_address: transactionData.token,
        risk_score: analysis.score,
        risk_level: analysis.level,
        risk_reasons: JSON.stringify(analysis.reasons || []), // Ensure valid JSON string
        heuristics: JSON.stringify(analysis.heuristics || {}), // Ensure valid JSON string
        status: 'pending',
        analyzed_at: new Date(),
      })
      .returning('*');
    
    logger.info('✅ Transaction saved to database SUCCESSFULLY!', {
      transactionId: transaction.id,
      userId: userId || 'anonymous',
      riskLevel: analysis.level,
      riskScore: analysis.score,
      dbRow: transaction,
    });

    res.json({
      success: true,
      analysis,
      transaction: transaction ? {
        id: transaction.id,
        risk_score: transaction.risk_score,
        risk_level: transaction.risk_level,
        status: transaction.status,
      } : null,
      authenticated: !!userId,
    });

  } catch (error) {
    logger.error('Transaction analysis error:', error);
    logger.error('Error stack:', error.stack);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      transactionData: req.body.transactionData,
    });
    
    res.status(500).json({
      success: false,
      error: 'Transaction analysis failed',
      details: error.message,
      debug: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Get transaction history
router.get('/history', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'approved', 'rejected', 'completed']),
  query('risk_level').optional().isIn(['low', 'medium', 'high']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { userId } = req.user;
    const {
      page = 1,
      limit = 20,
      status,
      risk_level,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = db('transactions')
      .where({ user_id: userId });

    if (status) {
      query = query.where({ status });
    }

    if (risk_level) {
      query = query.where({ risk_level });
    }

    // Get total count (without orderBy)
    const [{ count }] = await query.clone().count('* as count');

    // Get transactions (with orderBy)
    const transactions = await query
      .orderBy('analyzed_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select([
        'id',
        'signature',
        'type',
        'from_address',
        'to_address',
        'amount',
        'token_address',
        'token_symbol',
        'risk_score',
        'risk_level',
        'risk_reasons',
        'status',
        'user_approved',
        'user_feedback',
        'analyzed_at',
        'created_at',
      ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total: parseInt(count),
          pages: Math.ceil(count / limit),
        },
      },
    });

  } catch (error) {
    logger.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction history',
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const transaction = await db('transactions')
      .where({ id, user_id: userId })
      .first();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      transaction,
    });

  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction',
    });
  }
});

// Update transaction status
router.patch('/:id/status', [
  body('status').isIn(['approved', 'rejected']),
  body('feedback').optional().isString().trim().isLength({ max: 500 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { userId } = req.user;
    const { status, feedback } = req.body;

    const [updatedTransaction] = await db('transactions')
      .where({ id, user_id: userId })
      .update({
        status,
        user_approved: status === 'approved',
        user_feedback: feedback,
        updated_at: new Date(),
      })
      .returning('*');

    if (!updatedTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      transaction: updatedTransaction,
    });

  } catch (error) {
    logger.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update transaction status',
    });
  }
});

// Get risk statistics
router.get('/stats/risk', async (req, res) => {
  try {
    const { userId } = req.user;

    const stats = await db('transactions')
      .where({ user_id: userId })
      .select([
        db.raw('COUNT(*) as total_transactions'),
        db.raw('AVG(risk_score) as avg_risk_score'),
        db.raw('COUNT(CASE WHEN risk_level = \'high\' THEN 1 END) as high_risk_count'),
        db.raw('COUNT(CASE WHEN risk_level = \'medium\' THEN 1 END) as medium_risk_count'),
        db.raw('COUNT(CASE WHEN risk_level = \'low\' THEN 1 END) as low_risk_count'),
        db.raw('COUNT(CASE WHEN status = \'approved\' THEN 1 END) as approved_count'),
        db.raw('COUNT(CASE WHEN status = \'rejected\' THEN 1 END) as rejected_count'),
      ])
      .first();

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Get risk statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk statistics',
    });
  }
});

module.exports = router;
