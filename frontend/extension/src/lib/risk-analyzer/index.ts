/**
 * Risk Analyzer — local Solana transaction heuristics
 * Score semantics: 0 = low risk, 100 = high risk
 */

import type { Transaction as SolanaTransaction } from '@solana/web3.js';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { RiskAnalysis } from '../../types/transaction';
import { checkProgram } from './heuristics/program-check';
import { checkDangerousPermissions } from './heuristics/dangerous-permissions';
import { analyzeAmount } from './heuristics/amount-analysis';
import { checkScamPatterns } from './heuristics/scam-patterns';
import { checkToken } from './heuristics/token-check';

export function scoreToLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function collectProgramIds(tx: SolanaTransaction): PublicKey[] {
  const ids: PublicKey[] = [];
  for (const ix of tx.instructions || []) {
    try {
      if (ix.programId) ids.push(ix.programId);
    } catch {
      /* ignore */
    }
  }
  return ids;
}

function estimateLamports(tx: SolanaTransaction): number {
  for (const ix of tx.instructions || []) {
    try {
      if (ix.programId?.equals?.(SystemProgram.programId) && ix.data?.length >= 12) {
        if (ix.data[0] === 2) {
          const view = new DataView(ix.data.buffer, ix.data.byteOffset, ix.data.byteLength);
          const lamports = Number(view.getBigUint64(4, true));
          if (Number.isFinite(lamports)) return lamports;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return 0;
}

function firstTokenMint(tx: SolanaTransaction): PublicKey | null {
  for (const ix of tx.instructions || []) {
    try {
      if (ix.programId?.equals?.(TOKEN_PROGRAM_ID) && ix.keys?.length > 1) {
        const candidate = ix.keys[1]?.pubkey;
        if (candidate) return candidate;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Analyze a Solana transaction and return a risk score (0–100, higher = riskier).
 */
export async function analyzeTransaction(
  transaction: SolanaTransaction
): Promise<RiskAnalysis> {
  const reasons: string[] = [];
  const scoreBreakdown: Array<{ factor: string; points: number; detail?: string }> = [];
  let score = 15;
  scoreBreakdown.push({
    factor: 'baseline',
    points: 15,
    detail: 'Base score for any unsigned Solana transaction',
  });

  const programIds = collectProgramIds(transaction);
  let anyUnknownProgram = false;
  let programOk = true;

  for (const pid of programIds) {
    const result = await checkProgram(pid);
    if (!result.isKnown) {
      anyUnknownProgram = true;
      score += 18;
      scoreBreakdown.push({
        factor: 'unknown_program',
        points: 18,
        detail: result.reason || pid.toBase58().slice(0, 12) + '…',
      });
      if (result.reason) reasons.push(result.reason);
    } else if (!result.isSafe) {
      score += result.riskScore;
      scoreBreakdown.push({
        factor: 'unsafe_program',
        points: result.riskScore,
        detail: result.reason,
      });
      if (result.reason) reasons.push(result.reason);
      programOk = false;
    }
  }

  if (programIds.length === 0) {
    score += 10;
    scoreBreakdown.push({
      factor: 'no_instructions',
      points: 10,
      detail: 'No instructions found — limited analysis',
    });
    reasons.push('No instructions found — limited analysis');
  }

  const permissions = await checkDangerousPermissions(transaction);
  if (permissions.riskScore > 0) {
    score += permissions.riskScore;
    scoreBreakdown.push({
      factor: 'dangerous_permissions',
      points: permissions.riskScore,
      detail: permissions.reason,
    });
  }
  if (permissions.permissions.length > 0 || permissions.riskScore > 0) {
    reasons.push(permissions.reason);
  }

  const lamports = estimateLamports(transaction);
  const amountResult = await analyzeAmount(lamports);
  if (amountResult.riskScore > 0) {
    score += amountResult.riskScore;
    scoreBreakdown.push({
      factor: 'amount',
      points: amountResult.riskScore,
      detail: amountResult.reason || `${lamports} lamports`,
    });
  }
  if (amountResult.reason) reasons.push(amountResult.reason);

  const mint = firstTokenMint(transaction);
  let tokenCheck = true;
  if (mint) {
    const token = await checkToken(mint);
    if (token.riskScore > 0) {
      score += token.riskScore;
      scoreBreakdown.push({
        factor: 'token',
        points: token.riskScore,
        detail: token.reason,
      });
    }
    tokenCheck = token.isKnown || token.isVerified;
    if (token.reason) reasons.push(token.reason);

    const scam = await checkScamPatterns(mint);
    if (scam.riskScore > 0) {
      score += scam.riskScore;
      scoreBreakdown.push({
        factor: 'scam_patterns',
        points: scam.riskScore,
        detail: scam.reason,
      });
    }
    if (scam.reason && (scam.isBlacklisted || scam.matchesKnownScam || scam.suspiciousPatterns.length)) {
      reasons.push(scam.reason);
    }
  }

  if (anyUnknownProgram) {
    reasons.push('Transaction invokes unrecognized program ID(s)');
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  if (reasons.length === 0) {
    reasons.push('No elevated risk signals from local heuristics');
  }

  return {
    score,
    level: scoreToLevel(score),
    reasons: reasons.slice(0, 12),
    heuristics: {
      tokenCheck,
      programCheck: programOk && !anyUnknownProgram,
      accountReputation: Math.max(0, 100 - score),
      amountAnalysis: true,
    },
    scoreBreakdown,
  };
}

export * from './heuristics';
