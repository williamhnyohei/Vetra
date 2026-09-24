/**
 * Token Check — well-known mints vs unknown
 * riskScore: additive 0–20
 */

import type { PublicKey } from '@solana/web3.js';

export interface TokenCheckResult {
  isKnown: boolean;
  isVerified: boolean;
  riskScore: number;
  reason?: string;
}

const KNOWN_MINTS = new Set<string>([
  'So11111111111111111111111111111111111111112', // wSOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH (wormhole)
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
]);

export async function checkToken(tokenMint: PublicKey): Promise<TokenCheckResult> {
  const mint = tokenMint.toBase58();

  if (KNOWN_MINTS.has(mint)) {
    return {
      isKnown: true,
      isVerified: true,
      riskScore: 0,
    };
  }

  return {
    isKnown: false,
    isVerified: false,
    riskScore: 12,
    reason: `Unknown token mint: ${mint.slice(0, 8)}…`,
  };
}
