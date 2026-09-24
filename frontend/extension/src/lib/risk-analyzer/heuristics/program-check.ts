/**
 * Program Check — whitelist / denylist of Solana programs
 * riskScore contribution: 0–40 (higher = riskier)
 */

import type { PublicKey } from '@solana/web3.js';
import { SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface ProgramCheckResult {
  isKnown: boolean;
  isSafe: boolean;
  riskScore: number;
  reason?: string;
}

const ASSOCIATED_TOKEN_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

const SAFE_PROGRAMS = new Set<string>([
  SystemProgram.programId.toBase58(),
  TOKEN_PROGRAM_ID.toBase58(),
  ASSOCIATED_TOKEN_PROGRAM,
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  'ComputeBudget111111111111111111111111111111',
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
]);

const DENYLIST = new Set<string>([]);

export async function checkProgram(programId: PublicKey): Promise<ProgramCheckResult> {
  const id = programId.toBase58();

  if (DENYLIST.has(id)) {
    return {
      isKnown: true,
      isSafe: false,
      riskScore: 40,
      reason: `Blocked program ID: ${id.slice(0, 8)}…`,
    };
  }

  if (SAFE_PROGRAMS.has(id)) {
    return {
      isKnown: true,
      isSafe: true,
      riskScore: 0,
    };
  }

  return {
    isKnown: false,
    isSafe: false,
    riskScore: 15,
    reason: `Unknown program: ${id.slice(0, 8)}…`,
  };
}
