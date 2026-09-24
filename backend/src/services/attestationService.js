/**
 * Attestation Service
 * Uses Anchor IDL PDAs. Broadcasts on-chain only when ATTESTATION_AUTHORITY_SECRET
 * is configured and ATTESTATION_PROGRAM_ID points to a deployed program.
 * Otherwise records an explicit off-chain attestation (no random keypairs).
 */

const crypto = require('crypto');
const {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} = require('@solana/web3.js');
const logger = require('../utils/logger');
const idl = require('../../programs/attestation/idl.json');

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

const PLACEHOLDER_PROGRAM = 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';

function getProgramId() {
  const raw =
    process.env.ATTESTATION_PROGRAM_ID ||
    process.env.SOLANA_PROGRAM_ID ||
    idl.metadata?.address ||
    PLACEHOLDER_PROGRAM;
  return new PublicKey(raw);
}

function isOnChainEnabled() {
  const programId = getProgramId().toBase58();
  if (programId === SYSTEM_PROGRAM || programId === PLACEHOLDER_PROGRAM) {
    return false;
  }
  return Boolean(process.env.ATTESTATION_AUTHORITY_SECRET);
}

function loadAuthorityKeypair() {
  const secret = process.env.ATTESTATION_AUTHORITY_SECRET;
  if (!secret) return null;
  try {
    // Expect JSON array of secret key bytes, e.g. [1,2,...,64]
    const arr = JSON.parse(secret.trim());
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  } catch (e) {
    logger.error('Invalid ATTESTATION_AUTHORITY_SECRET (use JSON byte array):', e.message);
    return null;
  }
}

function hashToBytes32(transactionHash) {
  const hex = crypto.createHash('sha256').update(String(transactionHash)).digest();
  return Uint8Array.from(hex);
}

function deriveProviderPda(authority, programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('provider'), authority.toBuffer()],
    programId
  );
}

function deriveAttestationPda(provider, txHashBytes, programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('attestation'), provider.toBuffer(), Buffer.from(txHashBytes)],
    programId
  );
}

/** Minimal Anchor discriminator: sha256("global:<name>")[0..8] */
function ixDiscriminator(name) {
  return crypto.createHash('sha256').update(`global:${name}`).digest().subarray(0, 8);
}

function encodeCreateAttestationData(txHashBytes, riskScore, reason) {
  const reasonBuf = Buffer.from(reason || '', 'utf8');
  const reasonLen = Buffer.alloc(4);
  reasonLen.writeUInt32LE(reasonBuf.length, 0);
  return Buffer.concat([
    ixDiscriminator('create_attestation'),
    Buffer.from(txHashBytes),
    Buffer.from([riskScore & 0xff]),
    reasonLen,
    reasonBuf,
  ]);
}

async function createAttestation({
  providerPubkey,
  transactionHash,
  riskScore,
  riskLevel,
  stakeAmount,
  evidence,
}) {
  try {
    const programId = getProgramId();
    const txHashBytes = hashToBytes32(transactionHash);
    const providerPk = new PublicKey(providerPubkey);
    const [providerPda] = deriveProviderPda(providerPk, programId);
    const [attestationPda] = deriveAttestationPda(providerPda, txHashBytes, programId);

    if (!isOnChainEnabled()) {
      const offchainId = `offchain_${crypto
        .createHash('sha256')
        .update(`${providerPubkey}:${transactionHash}:${Date.now()}`)
        .digest('hex')
        .slice(0, 32)}`;

      logger.info('Attestation recorded off-chain (program not deployed / no authority key)', {
        providerPubkey,
        transactionHash,
        attestationPda: attestationPda.toBase58(),
        programId: programId.toBase58(),
      });

      return {
        success: true,
        signature: offchainId,
        transactionHash: offchainId,
        onChain: false,
        mode: 'offchain',
        pdas: {
          provider: providerPda.toBase58(),
          attestation: attestationPda.toBase58(),
        },
        riskLevel,
        stakeAmount,
        evidence,
      };
    }

    const authority = loadAuthorityKeypair();
    if (!authority) {
      return { success: false, error: 'Authority keypair unavailable' };
    }

    // Authority must match provider for this simplified path
    if (authority.publicKey.toBase58() !== providerPubkey) {
      logger.warn('Authority pubkey differs from providerPubkey — using authority as fee payer');
    }

    const data = encodeCreateAttestationData(
      txHashBytes,
      Math.min(100, Math.max(0, Number(riskScore) || 0)),
      typeof evidence === 'string' ? evidence : JSON.stringify(evidence || { riskLevel })
    );

    const ix = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: attestationPda, isSigner: false, isWritable: true },
        { pubkey: providerPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    const tx = new Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;
    tx.sign(authority);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

    logger.info('Attestation created on-chain', {
      signature,
      attestationPda: attestationPda.toBase58(),
      providerPubkey,
    });

    return {
      success: true,
      signature,
      transactionHash: signature,
      onChain: true,
      mode: 'onchain',
      pdas: {
        provider: providerPda.toBase58(),
        attestation: attestationPda.toBase58(),
      },
    };
  } catch (error) {
    logger.error('Create attestation error:', error);
    return { success: false, error: error.message };
  }
}

async function voteAttestation({ attestationId, voterPubkey, vote, stakeAmount }) {
  try {
    if (!isOnChainEnabled()) {
      const sig = `offchain_vote_${crypto.randomBytes(16).toString('hex')}`;
      return { success: true, signature: sig, onChain: false, mode: 'offchain', vote, stakeAmount };
    }

    const authority = loadAuthorityKeypair();
    if (!authority) return { success: false, error: 'Authority keypair unavailable' };

    const programId = getProgramId();
    const isAccurate = vote === true || vote === 'approve' || vote === 'for';
    const data = Buffer.concat([
      ixDiscriminator('vote_attestation'),
      Buffer.from([isAccurate ? 1 : 0]),
    ]);

    const ix = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: new PublicKey(attestationId), isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      ],
      data,
    });

    const tx = new Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;
    tx.sign(authority);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

    return { success: true, signature, onChain: true, mode: 'onchain' };
  } catch (error) {
    logger.error('Vote attestation error:', error);
    return { success: false, error: error.message };
  }
}

async function stakeReputation({ providerPubkey, amount }) {
  try {
    if (!isOnChainEnabled()) {
      return {
        success: true,
        signature: `offchain_stake_${crypto.randomBytes(12).toString('hex')}`,
        onChain: false,
        mode: 'offchain',
        amount,
        providerPubkey,
      };
    }

    const authority = loadAuthorityKeypair();
    if (!authority) return { success: false, error: 'Authority keypair unavailable' };

    const programId = getProgramId();
    const [providerPda] = deriveProviderPda(new PublicKey(providerPubkey), programId);
    const lamports = BigInt(Math.floor(parseFloat(amount) * 1e9));
    const amountBuf = Buffer.alloc(8);
    amountBuf.writeBigUInt64LE(lamports);

    const data = Buffer.concat([ixDiscriminator('stake_reputation'), amountBuf]);
    const ix = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: providerPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data,
    });

    const tx = new Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;
    tx.sign(authority);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

    return { success: true, signature, onChain: true, mode: 'onchain' };
  } catch (error) {
    logger.error('Stake reputation error:', error);
    return { success: false, error: error.message };
  }
}

async function withdrawStake({ providerPubkey, amount }) {
  try {
    if (!isOnChainEnabled()) {
      return {
        success: true,
        signature: `offchain_withdraw_${crypto.randomBytes(12).toString('hex')}`,
        onChain: false,
        mode: 'offchain',
        amount,
        providerPubkey,
      };
    }

    const authority = loadAuthorityKeypair();
    if (!authority) return { success: false, error: 'Authority keypair unavailable' };

    const programId = getProgramId();
    const [providerPda] = deriveProviderPda(new PublicKey(providerPubkey), programId);
    const lamports = BigInt(Math.floor(parseFloat(amount) * 1e9));
    const amountBuf = Buffer.alloc(8);
    amountBuf.writeBigUInt64LE(lamports);

    const data = Buffer.concat([ixDiscriminator('withdraw_stake'), amountBuf]);
    const ix = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: providerPda, isSigner: false, isWritable: true },
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
      ],
      data,
    });

    const tx = new Transaction().add(ix);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = authority.publicKey;
    tx.sign(authority);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

    return { success: true, signature, onChain: true, mode: 'onchain' };
  } catch (error) {
    logger.error('Withdraw stake error:', error);
    return { success: false, error: error.message };
  }
}

async function getAttestationOnChain(attestationId) {
  try {
    if (String(attestationId).startsWith('offchain_')) {
      return {
        success: true,
        attestation: {
          id: attestationId,
          onChain: false,
          mode: 'offchain',
        },
      };
    }

    const info = await connection.getAccountInfo(new PublicKey(attestationId));
    if (!info) {
      return { success: false, error: 'Attestation account not found' };
    }

    return {
      success: true,
      attestation: {
        id: attestationId,
        onChain: true,
        owner: info.owner.toBase58(),
        lamports: info.lamports,
        dataLength: info.data.length,
      },
    };
  } catch (error) {
    logger.error('Get attestation on-chain error:', error);
    return { success: false, error: error.message };
  }
}

async function calculateReputation(providerPubkey) {
  try {
    // DB-oriented callers should prefer reputationService; this is a lightweight estimate
    const programId = getProgramId();
    const [providerPda] = deriveProviderPda(new PublicKey(providerPubkey), programId);
    const info = await connection.getAccountInfo(providerPda);

    let reputation = 100;
    if (info) {
      reputation = Math.min(1000, 100 + Math.floor(info.lamports / 1e7));
    }

    return {
      success: true,
      reputation,
      providerPda: providerPda.toBase58(),
      onChainAccount: Boolean(info),
    };
  } catch (error) {
    logger.error('Calculate reputation error:', error);
    return { success: false, error: error.message };
  }
}

async function verifyAttestationAccuracy(attestationId, actualOutcome) {
  try {
    const attestation = await getAttestationOnChain(attestationId);
    if (!attestation.success) {
      return { success: false, error: 'Attestation not found' };
    }

    const predictedRisk = attestation.attestation.riskScore ?? actualOutcome?.predictedRisk ?? 50;
    const actualRisk = actualOutcome.riskScore;
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
    return { success: false, error: error.message };
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
  getProgramId,
  isOnChainEnabled,
  deriveProviderPda,
  deriveAttestationPda,
};
