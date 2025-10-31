/**
 * Transaction Routes
 * Handles transaction analysis and history
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { cache } = require('../config/redis');
const { analyzeTransactionWithMultiAgent } = require('../services/multiAgentRiskAnalyzer');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Analyze transaction (requires authentication)
router.post('/analyze', authenticateToken, [
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
    const { userId } = req.user;

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

    // 📌 STEP 1: SAVE IMMEDIATELY AS 'INTERCEPTED' (before analysis)
    logger.info('💾 Step 1: Saving transaction as INTERCEPTED (before analysis)...', {
      userId,
      type: transactionData.type,
      from: transactionData.from,
      to: transactionData.to,
      amount: transactionData.amount,
    });

    const [initialTransaction] = await db('transactions')
      .insert({
        user_id: userId,
        signature: transactionData.signature,
        transaction_hash: transactionData.signature,
        type: transactionData.type,
        from_address: transactionData.from,
        to_address: transactionData.to,
        amount: transactionData.amount,
        token_address: transactionData.token,
        risk_score: null, // ainda não analisado
        risk_level: null,
        risk_reasons: null,
        heuristics: null,
        status: 'intercepted', // Status inicial: transação foi interceptada
        analyzed_at: null,
        created_at: new Date(),
      })
      .returning('*');
    
    logger.info('✅ Step 1 COMPLETE: Transaction saved as INTERCEPTED!', {
      transactionId: initialTransaction.id,
      status: 'intercepted',
    });

    // 📌 STEP 2: PERFORM RISK ANALYSIS
    logger.info('🤖 Step 2: Performing risk analysis with Multi-Agent System...');
    
    const analysis = await analyzeTransactionWithMultiAgent(transactionData, {
      userId,
      analysisDepth: 'standard',
      includeOnChainData: true,
      includeMlPrediction: true,
    });

    // Cache the analysis
    await cache.set(cacheKey, analysis, 3600); // 1 hour

    // 📌 STEP 3: UPDATE WITH ANALYSIS RESULTS (still pending user decision)
    logger.info('💾 Step 3: Updating transaction with analysis results...', {
      transactionId: initialTransaction.id,
      riskScore: analysis.score,
      riskLevel: analysis.level,
    });

    const [transaction] = await db('transactions')
      .where({ id: initialTransaction.id })
      .update({
        risk_score: analysis.score,
        risk_level: analysis.level,
        risk_reasons: JSON.stringify(analysis.reasons || []),
        heuristics: JSON.stringify(analysis.heuristics || {}),
        status: 'pending', // Status muda para pending (aguardando decisão do usuário)
        analyzed_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    logger.info('✅ Step 3 COMPLETE: Transaction updated with analysis!', {
      transactionId: transaction.id,
      userId,
      riskLevel: analysis.level,
      riskScore: analysis.score,
      status: 'pending',
    });

    res.json({
      success: true,
      analysis,
      transaction: {
        id: transaction.id,
        risk_score: transaction.risk_score,
        risk_level: transaction.risk_level,
        status: transaction.status,
      },
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

// 🎲 Analyze transaction (DEMO/PUBLIC - no authentication required)
router.post('/analyze-demo', [
  body('transaction_hash').optional().isString(),
  body('from_address').isString().notEmpty(),
  body('to_address').isString().notEmpty(),
  body('amount').isString().notEmpty(),
  body('token').optional().isString(),
  body('network').optional().isString(),
  body('metadata').optional().isString(),
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

    logger.info('🎲 DEMO: Analyzing transaction without authentication', {
      from: req.body.from_address,
      to: req.body.to_address,
      amount: req.body.amount,
    });

    // Parse metadata if it's a string
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = typeof req.body.metadata === 'string' 
          ? JSON.parse(req.body.metadata) 
          : req.body.metadata;
      } catch (e) {
        logger.warn('Failed to parse metadata:', e);
      }
    }

    // Extract risk info from metadata if available
    const riskScore = metadata.risk_score || Math.floor(Math.random() * 100);
    const riskLevel = metadata.risk_level || 
      (riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : riskScore < 85 ? 'high' : 'critical');
    const riskReasons = metadata.risk_reasons || [];

    // Save transaction with user_id = null (public demo transaction)
    const [transaction] = await db('transactions')
      .insert({
        user_id: null, // Public demo transaction
        signature: req.body.transaction_hash,
        transaction_hash: req.body.transaction_hash,
        type: 'transfer',
        from_address: req.body.from_address,
        to_address: req.body.to_address,
        amount: req.body.amount,
        token_address: req.body.token,
        token_symbol: req.body.token,
        risk_score: riskScore,
        risk_level: riskLevel,
        risk_reasons: JSON.stringify(riskReasons),
        heuristics: JSON.stringify({ demo: true }),
        status: 'pending',
        analyzed_at: new Date(),
        created_at: new Date(),
      })
      .returning('*');

    logger.info('✅ DEMO: Transaction saved!', {
      id: transaction.id,
      riskScore,
      riskLevel,
    });

    res.json({
      success: true,
      id: transaction.id,
      transaction_id: transaction.id,
      analysis: {
        score: riskScore,
        level: riskLevel,
        reasons: riskReasons,
      },
    });

  } catch (error) {
    logger.error('Demo transaction analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Transaction analysis failed',
      details: error.message,
    });
  }
});

// Get transaction history
router.get('/history', authenticateToken, [
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

    // Build query - include user's transactions AND public demo transactions (user_id = null)
    let query = db('transactions').where(function() {
      this.where({ user_id: userId }).orWhere({ user_id: null });
    });

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
      transactions,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit),
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
router.get('/:id', authenticateToken, async (req, res) => {
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
router.patch('/:id/status', authenticateToken, [
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
router.get('/stats/risk', authenticateToken, async (req, res) => {
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
