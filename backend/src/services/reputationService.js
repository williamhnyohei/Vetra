/**
 * Reputation Service
 * Handles provider reputation and staking system
 */

const { db } = require('../config/database');
const { cache } = require('../config/redis');
const { calculateReputation, verifyAttestationAccuracy } = require('./attestationService');
const logger = require('../utils/logger');

/**
 * Update provider reputation based on attestation accuracy
 */
async function updateProviderReputation(providerPubkey, attestationId, actualOutcome) {
  try {
    // Verify attestation accuracy
    const accuracyResult = await verifyAttestationAccuracy(attestationId, actualOutcome);
    
    if (!accuracyResult.success) {
      return {
        success: false,
        error: accuracyResult.error,
      };
    }

    // Get current provider data
    const provider = await db('providers')
      .where({ pubkey: providerPubkey })
      .first();

    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }

    // Calculate new reputation
    const reputationResult = await calculateReputation(providerPubkey);
    
    if (!reputationResult.success) {
      return {
        success: false,
        error: reputationResult.error,
      };
    }

    // Update provider reputation
    const newReputation = reputationResult.reputation;
    const accuracyRate = provider.attestation_count > 0 
      ? (provider.successful_attestations / provider.attestation_count) * 100 
      : 0;

    await db('providers')
      .where({ pubkey: providerPubkey })
      .update({
        reputation: newReputation,
        successful_attestations: accuracyResult.accurate 
          ? provider.successful_attestations + 1 
          : provider.successful_attestations,
        accuracy_rate: accuracyRate,
        updated_at: new Date(),
      });

    // Clear provider cache
    await cache.del(`provider:${providerPubkey}`);

    logger.info('Provider reputation updated', {
      providerPubkey,
      oldReputation: provider.reputation,
      newReputation,
      accurate: accuracyResult.accurate,
    });

    return {
      success: true,
      reputation: newReputation,
      accuracy: accuracyResult.accurate,
    };

  } catch (error) {
    logger.error('Update provider reputation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate provider reputation score
 */
async function calculateProviderReputation(providerPubkey) {
  try {
    const provider = await db('providers')
      .where({ pubkey: providerPubkey })
      .first();

    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }

    // Base reputation factors
    const factors = {
      base: 50, // Base reputation
      accuracy: 0,
      stake: 0,
      time: 0,
      activity: 0,
    };

    // Accuracy factor (0-30 points)
    if (provider.attestation_count > 0) {
      const accuracyRate = (provider.successful_attestations / provider.attestation_count) * 100;
      factors.accuracy = Math.min(30, accuracyRate * 0.3);
    }

    // Stake factor (0-20 points)
    const stakeAmount = parseFloat(provider.total_stake || 0);
    if (stakeAmount > 0) {
      factors.stake = Math.min(20, Math.log10(stakeAmount + 1) * 5);
    }

    // Time factor (0-15 points)
    const daysActive = provider.created_at 
      ? (Date.now() - new Date(provider.created_at).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    factors.time = Math.min(15, daysActive * 0.5);

    // Activity factor (0-10 points)
    const recentAttestations = await db('attestations')
      .where({ provider_pubkey: providerPubkey })
      .where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      .count('* as count')
      .first();
    
    factors.activity = Math.min(10, parseInt(recentAttestations.count) * 0.5);

    // Calculate total reputation
    const totalReputation = Math.min(1000, 
      factors.base + factors.accuracy + factors.stake + factors.time + factors.activity
    );

    return {
      success: true,
      reputation: Math.round(totalReputation),
      factors,
      breakdown: {
        base: Math.round(factors.base),
        accuracy: Math.round(factors.accuracy),
        stake: Math.round(factors.stake),
        time: Math.round(factors.time),
        activity: Math.round(factors.activity),
      },
    };

  } catch (error) {
    logger.error('Calculate provider reputation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get provider leaderboard
 */
async function getProviderLeaderboard(limit = 10) {
  try {
    const providers = await db('providers')
      .where({ is_active: true })
      .orderBy('reputation', 'desc')
      .orderBy('accuracy_rate', 'desc')
      .orderBy('total_stake', 'desc')
      .limit(limit)
      .select([
        'pubkey',
        'name',
        'reputation',
        'total_stake',
        'attestation_count',
        'successful_attestations',
        'accuracy_rate',
        'created_at',
      ]);

    return {
      success: true,
      leaderboard: providers.map((provider, index) => ({
        rank: index + 1,
        pubkey: provider.pubkey,
        name: provider.name,
        reputation: provider.reputation,
        total_stake: provider.total_stake,
        attestation_count: provider.attestation_count,
        successful_attestations: provider.successful_attestations,
        accuracy_rate: provider.accuracy_rate,
        created_at: provider.created_at,
      })),
    };

  } catch (error) {
    logger.error('Get provider leaderboard error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get provider statistics
 */
async function getProviderStats(providerPubkey) {
  try {
    const provider = await db('providers')
      .where({ pubkey: providerPubkey })
      .first();

    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }

    // Get recent attestations
    const recentAttestations = await db('attestations')
      .where({ provider_pubkey: providerPubkey })
      .orderBy('created_at', 'desc')
      .limit(10)
      .select([
        'id',
        'transaction_hash',
        'risk_score',
        'risk_level',
        'stake_amount',
        'verified',
        'created_at',
      ]);

    // Get monthly stats
    const monthlyStats = await db('attestations')
      .where({ provider_pubkey: providerPubkey })
      .where('created_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .select([
        db.raw('COUNT(*) as total_attestations'),
        db.raw('COUNT(CASE WHEN verified = true THEN 1 END) as verified_attestations'),
        db.raw('AVG(risk_score) as avg_risk_score'),
        db.raw('SUM(stake_amount) as total_stake_this_month'),
      ])
      .first();

    return {
      success: true,
      stats: {
        provider: {
          pubkey: provider.pubkey,
          name: provider.name,
          reputation: provider.reputation,
          total_stake: provider.total_stake,
          attestation_count: provider.attestation_count,
          successful_attestations: provider.successful_attestations,
          accuracy_rate: provider.accuracy_rate,
          is_verified: provider.is_verified,
          created_at: provider.created_at,
        },
        recent_attestations: recentAttestations,
        monthly_stats: monthlyStats,
      },
    };

  } catch (error) {
    logger.error('Get provider stats error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update provider verification status
 */
async function updateProviderVerification(providerPubkey, verified) {
  try {
    const [updatedProvider] = await db('providers')
      .where({ pubkey: providerPubkey })
      .update({
        is_verified: verified,
        updated_at: new Date(),
      })
      .returning('*');

    if (!updatedProvider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }

    // Clear provider cache
    await cache.del(`provider:${providerPubkey}`);

    logger.info('Provider verification updated', {
      providerPubkey,
      verified,
    });

    return {
      success: true,
      provider: updatedProvider,
    };

  } catch (error) {
    logger.error('Update provider verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate staking rewards
 */
async function calculateStakingRewards(providerPubkey) {
  try {
    const provider = await db('providers')
      .where({ pubkey: providerPubkey })
      .first();

    if (!provider) {
      return {
        success: false,
        error: 'Provider not found',
      };
    }

    // Calculate rewards based on reputation and stake
    const baseReward = 0.01; // 0.01 SOL per day base reward
    const reputationMultiplier = provider.reputation / 1000; // 0-1 based on reputation
    const stakeMultiplier = Math.log10(parseFloat(provider.total_stake || 0) + 1) / 10; // Log scale
    
    const dailyReward = baseReward * (1 + reputationMultiplier + stakeMultiplier);
    const monthlyReward = dailyReward * 30;

    return {
      success: true,
      rewards: {
        daily: dailyReward,
        monthly: monthlyReward,
        factors: {
          base: baseReward,
          reputation_multiplier: reputationMultiplier,
          stake_multiplier: stakeMultiplier,
        },
      },
    };

  } catch (error) {
    logger.error('Calculate staking rewards error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get reputation history
 */
async function getReputationHistory(providerPubkey, days = 30) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    // This would typically come from a reputation_history table
    // For now, we'll simulate the data
    const history = [];
    const currentReputation = await calculateProviderReputation(providerPubkey);
    
    if (!currentReputation.success) {
      return {
        success: false,
        error: currentReputation.error,
      };
    }

    // Generate mock history data
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const reputation = Math.max(0, currentReputation.reputation - (days - i) * 2 + Math.random() * 4);
      
      history.push({
        date: date.toISOString().split('T')[0],
        reputation: Math.round(reputation),
      });
    }

    return {
      success: true,
      history,
    };

  } catch (error) {
    logger.error('Get reputation history error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  updateProviderReputation,
  calculateProviderReputation,
  getProviderLeaderboard,
  getProviderStats,
  updateProviderVerification,
  calculateStakingRewards,
  getReputationHistory,
};
