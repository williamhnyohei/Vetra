/**
 * Attestation Service
 * Handles on-chain attestation operations
 */

const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createTransferInstruction } = require('@solana/spl-token');
const logger = require('../utils/logger');

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Attestation program ID (deployed program)
const ATTESTATION_PROGRAM_ID = new PublicKey(
  process.env.ATTESTATION_PROGRAM_ID || '11111111111111111111111111111111' // Default to system program if not set
);

/**
 * Create attestation on-chain
 */
async function createAttestation({
  providerPubkey,
  transactionHash,
  riskScore,
  riskLevel,
  stakeAmount,
  evidence,
}) {
  try {
    // This would interact with the deployed Anchor program
    // For now, we'll simulate the on-chain interaction
    
    const providerKeypair = Keypair.generate(); // In production, this would be the actual provider keypair
    
    // Create attestation instruction
    const attestationInstruction = {
      programId: ATTESTATION_PROGRAM_ID,
      keys: [
        { pubkey: new PublicKey(providerPubkey), isSigner: true, isWritable: false },
        { pubkey: new PublicKey(transactionHash), isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(JSON.stringify({
        riskScore,
        riskLevel,
        stakeAmount,
        evidence,
      })),
    };

    // Create transaction
    const transaction = new Transaction().add(attestationInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = providerKeypair.publicKey;

    // Sign transaction
    transaction.sign(providerKeypair);

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [providerKeypair]);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);

    logger.info('Attestation created on-chain', {
      providerPubkey,
      transactionHash,
      riskScore,
      stakeAmount,
      signature,
    });

    return {
      success: true,
      signature,
      transactionHash: signature,
    };

  } catch (error) {
    logger.error('Create attestation on-chain error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Vote on attestation
 */
async function voteAttestation({
  attestationId,
  voterPubkey,
  vote,
  stakeAmount,
}) {
  try {
    const voterKeypair = Keypair.generate(); // In production, actual voter keypair
    
    // Create vote instruction
    const voteInstruction = {
      programId: ATTESTATION_PROGRAM_ID,
      keys: [
        { pubkey: new PublicKey(voterPubkey), isSigner: true, isWritable: false },
        { pubkey: new PublicKey(attestationId), isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(JSON.stringify({
        vote,
        stakeAmount,
      })),
    };

    // Create transaction
    const transaction = new Transaction().add(voteInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = voterKeypair.publicKey;

    // Sign transaction
    transaction.sign(voterKeypair);

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [voterKeypair]);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);

    logger.info('Vote cast on-chain', {
      attestationId,
      voterPubkey,
      vote,
      stakeAmount,
      signature,
    });

    return {
      success: true,
      signature,
    };

  } catch (error) {
    logger.error('Vote attestation on-chain error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Stake reputation
 */
async function stakeReputation({
  providerPubkey,
  amount,
}) {
  try {
    const providerKeypair = Keypair.generate(); // In production, actual provider keypair
    
    // Create stake instruction
    const stakeInstruction = {
      programId: ATTESTATION_PROGRAM_ID,
      keys: [
        { pubkey: new PublicKey(providerPubkey), isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(JSON.stringify({
        amount: parseFloat(amount),
        action: 'stake',
      })),
    };

    // Create transaction
    const transaction = new Transaction().add(stakeInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = providerKeypair.publicKey;

    // Sign transaction
    transaction.sign(providerKeypair);

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [providerKeypair]);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);

    logger.info('Reputation staked on-chain', {
      providerPubkey,
      amount,
      signature,
    });

    return {
      success: true,
      signature,
    };

  } catch (error) {
    logger.error('Stake reputation on-chain error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Withdraw stake
 */
async function withdrawStake({
  providerPubkey,
  amount,
}) {
  try {
    const providerKeypair = Keypair.generate(); // In production, actual provider keypair
    
    // Create withdraw instruction
    const withdrawInstruction = {
      programId: ATTESTATION_PROGRAM_ID,
      keys: [
        { pubkey: new PublicKey(providerPubkey), isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: Buffer.from(JSON.stringify({
        amount: parseFloat(amount),
        action: 'withdraw',
      })),
    };

    // Create transaction
    const transaction = new Transaction().add(withdrawInstruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = providerKeypair.publicKey;

    // Sign transaction
    transaction.sign(providerKeypair);

    // Send transaction
    const signature = await connection.sendTransaction(transaction, [providerKeypair]);
    
    // Wait for confirmation
    await connection.confirmTransaction(signature);

    logger.info('Stake withdrawn on-chain', {
      providerPubkey,
      amount,
      signature,
    });

    return {
      success: true,
      signature,
    };

  } catch (error) {
    logger.error('Withdraw stake on-chain error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get attestation from blockchain
 */
async function getAttestationOnChain(attestationId) {
  try {
    // This would query the on-chain attestation account
    // For now, return mock data
    return {
      success: true,
      attestation: {
        id: attestationId,
        provider: 'mock-provider-pubkey',
        transactionHash: 'mock-transaction-hash',
        riskScore: 75,
        riskLevel: 'high',
        stakeAmount: 5.0,
        votes: {
          approve: 3,
          reject: 1,
        },
        verified: true,
        createdAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    logger.error('Get attestation on-chain error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Calculate provider reputation
 */
async function calculateReputation(providerPubkey) {
  try {
    // This would calculate reputation based on:
    // - Accuracy of attestations
    // - Stake amount
    // - Community votes
    // - Time active
    
    // For now, return mock calculation
    const baseReputation = 50;
    const accuracyBonus = 20;
    const stakeBonus = 15;
    const timeBonus = 10;
    
    const totalReputation = Math.min(1000, baseReputation + accuracyBonus + stakeBonus + timeBonus);
    
    return {
      success: true,
      reputation: totalReputation,
      factors: {
        base: baseReputation,
        accuracy: accuracyBonus,
        stake: stakeBonus,
        time: timeBonus,
      },
    };

  } catch (error) {
    logger.error('Calculate reputation error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify attestation accuracy
 */
async function verifyAttestationAccuracy(attestationId, actualOutcome) {
  try {
    // This would compare the attestation prediction with actual outcome
    // and update provider reputation accordingly
    
    const attestation = await getAttestationOnChain(attestationId);
    
    if (!attestation.success) {
      return {
        success: false,
        error: 'Attestation not found',
      };
    }

    const predictedRisk = attestation.attestation.riskScore;
    const actualRisk = actualOutcome.riskScore;
    
    // Calculate accuracy (within 20 points is considered accurate)
    const accuracy = Math.abs(predictedRisk - actualRisk) <= 20;
    
    return {
      success: true,
      accurate: accuracy,
      predictedRisk,
      actualRisk,
      difference: Math.abs(predictedRisk - actualRisk),
    };

  } catch (error) {
    logger.error('Verify attestation accuracy error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  createAttestation,
  voteAttestation,
  stakeReputation,
  withdrawStake,
  getAttestationOnChain,
  calculateReputation,
  verifyAttestationAccuracy,
};
