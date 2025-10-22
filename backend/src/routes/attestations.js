/**
 * Attestation Routes
 * Handles on-chain attestation system
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { cache } = require('../config/redis');
const { createAttestation, voteAttestation, stakeReputation } = require('../services/attestationService');
const logger = require('../utils/logger');

const router = express.Router();

// Create attestation
router.post('/', [
  body('transactionHash').isString().notEmpty(),
  body('riskScore').isInt({ min: 0, max: 100 }),
  body('riskLevel').isIn(['low', 'medium', 'high']),
  body('evidence').optional().isObject(),
  body('stakeAmount').isDecimal().custom((value) => {
    if (parseFloat(value) < 1) {
      throw new Error('Minimum stake amount is 1 SOL');
    }
    return true;
  }),
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
      transactionHash,
      riskScore,
      riskLevel,
      evidence = {},
      stakeAmount,
    } = req.body;

    // Check if user is a provider
    const provider = await db('providers')
      .where({ pubkey: req.user.pubkey })
      .first();

    if (!provider || !provider.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Provider not found or inactive',
      });
    }

    // Create attestation on-chain
    const attestationResult = await createAttestation({
      providerPubkey: provider.pubkey,
      transactionHash,
      riskScore,
      riskLevel,
      stakeAmount,
      evidence,
    });

    if (!attestationResult.success) {
      return res.status(400).json({
        success: false,
        error: attestationResult.error,
      });
    }

    // Store attestation in database
    const [attestation] = await db('attestations')
      .insert({
        provider_pubkey: provider.pubkey,
        transaction_hash: transactionHash,
        risk_score: riskScore,
        risk_level: riskLevel,
        stake_amount: stakeAmount,
        reputation: provider.reputation,
        verified: false,
        evidence,
        on_chain_signature: attestationResult.signature,
      })
      .returning('*');

    // Update provider stats
    await db('providers')
      .where({ pubkey: provider.pubkey })
      .increment('attestation_count', 1)
      .update({
        total_stake: db.raw('total_stake + ?', [stakeAmount]),
        last_attestation_at: new Date(),
      });

    res.json({
      success: true,
      attestation: {
        id: attestation.id,
        provider_pubkey: attestation.provider_pubkey,
        transaction_hash: attestation.transaction_hash,
        risk_score: attestation.risk_score,
        risk_level: attestation.risk_level,
        stake_amount: attestation.stake_amount,
        reputation: attestation.reputation,
        verified: attestation.verified,
        on_chain_signature: attestation.on_chain_signature,
        created_at: attestation.created_at,
      },
    });

  } catch (error) {
    logger.error('Create attestation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create attestation',
    });
  }
});

// Get attestations
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('transactionHash').optional().isString(),
  query('providerPubkey').optional().isString(),
  query('riskLevel').optional().isIn(['low', 'medium', 'high']),
  query('verified').optional().isBoolean(),
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

    const {
      page = 1,
      limit = 20,
      transactionHash,
      providerPubkey,
      riskLevel,
      verified,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build query
    let query = db('attestations')
      .orderBy('created_at', 'desc');

    if (transactionHash) {
      query = query.where({ transaction_hash: transactionHash });
    }

    if (providerPubkey) {
      query = query.where({ provider_pubkey: providerPubkey });
    }

    if (riskLevel) {
      query = query.where({ risk_level: riskLevel });
    }

    if (verified !== undefined) {
      query = query.where({ verified: verified });
    }

    // Get total count
    const [{ count }] = await query.clone().count('* as count');

    // Get attestations
    const attestations = await query
      .limit(limit)
      .offset(offset)
      .select([
        'id',
        'provider_pubkey',
        'transaction_hash',
        'risk_score',
        'risk_level',
        'stake_amount',
        'reputation',
        'verified',
        'evidence',
        'on_chain_signature',
        'created_at',
      ]);

    res.json({
      success: true,
      data: {
        attestations,
        pagination: {
          page,
          limit,
          total: parseInt(count),
          pages: Math.ceil(count / limit),
        },
      },
    });

  } catch (error) {
    logger.error('Get attestations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attestations',
    });
  }
});

// Get attestation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const attestation = await db('attestations')
      .where({ id })
      .first();

    if (!attestation) {
      return res.status(404).json({
        success: false,
        error: 'Attestation not found',
      });
    }

    res.json({
      success: true,
      attestation,
    });

  } catch (error) {
    logger.error('Get attestation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get attestation',
    });
  }
});

// Vote on attestation
router.post('/:id/vote', [
  body('vote').isIn(['approve', 'reject']),
  body('stakeAmount').isDecimal().custom((value) => {
    if (parseFloat(value) < 0.1) {
      throw new Error('Minimum vote stake is 0.1 SOL');
    }
    return true;
  }),
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
    const { vote, stakeAmount } = req.body;

    // Get attestation
    const attestation = await db('attestations')
      .where({ id })
      .first();

    if (!attestation) {
      return res.status(404).json({
        success: false,
        error: 'Attestation not found',
      });
    }

    // Check if user is a provider
    const provider = await db('providers')
      .where({ pubkey: req.user.pubkey })
      .first();

    if (!provider || !provider.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Provider not found or inactive',
      });
    }

    // Vote on-chain
    const voteResult = await voteAttestation({
      attestationId: attestation.id,
      voterPubkey: provider.pubkey,
      vote,
      stakeAmount,
    });

    if (!voteResult.success) {
      return res.status(400).json({
        success: false,
        error: voteResult.error,
      });
    }

    // Update attestation verification status
    const totalVotes = await db('attestation_votes')
      .where({ attestation_id: id })
      .count('* as count')
      .first();

    const approvalRate = await db('attestation_votes')
      .where({ attestation_id: id, vote: 'approve' })
      .count('* as count')
      .first();

    const isVerified = (approvalRate.count / totalVotes.count) > 0.6; // 60% approval

    if (isVerified) {
      await db('attestations')
        .where({ id })
        .update({ verified: true });
    }

    res.json({
      success: true,
      vote: {
        attestation_id: id,
        vote,
        stake_amount: stakeAmount,
        on_chain_signature: voteResult.signature,
      },
    });

  } catch (error) {
    logger.error('Vote attestation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to vote on attestation',
    });
  }
});

// Stake reputation
router.post('/stake', [
  body('amount').isDecimal().custom((value) => {
    if (parseFloat(value) < 1) {
      throw new Error('Minimum stake amount is 1 SOL');
    }
    return true;
  }),
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
    const { amount } = req.body;

    // Check if user is a provider
    const provider = await db('providers')
      .where({ pubkey: req.user.pubkey })
      .first();

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found',
      });
    }

    // Stake on-chain
    const stakeResult = await stakeReputation({
      providerPubkey: provider.pubkey,
      amount,
    });

    if (!stakeResult.success) {
      return res.status(400).json({
        success: false,
        error: stakeResult.error,
      });
    }

    // Update provider stake
    await db('providers')
      .where({ pubkey: provider.pubkey })
      .increment('total_stake', amount)
      .update({
        last_stake_at: new Date(),
      });

    res.json({
      success: true,
      stake: {
        provider_pubkey: provider.pubkey,
        amount,
        total_stake: provider.total_stake + parseFloat(amount),
        on_chain_signature: stakeResult.signature,
      },
    });

  } catch (error) {
    logger.error('Stake reputation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stake reputation',
    });
  }
});

// Get provider stats
router.get('/providers/stats', async (req, res) => {
  try {
    const stats = await db('providers')
      .select([
        db.raw('COUNT(*) as total_providers'),
        db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_providers'),
        db.raw('COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_providers'),
        db.raw('AVG(reputation) as avg_reputation'),
        db.raw('AVG(total_stake) as avg_stake'),
        db.raw('SUM(total_stake) as total_stake'),
      ])
      .first();

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Get provider stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider stats',
    });
  }
});

module.exports = router;
