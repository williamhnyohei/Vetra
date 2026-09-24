/**
 * Scam Patterns — denylist + lookalike names
 * riskScore: additive 0–50
 */

import type { PublicKey } from '@solana/web3.js';

export interface ScamPatternsResult {
  isBlacklisted: boolean;
  matchesKnownScam: boolean;
  suspiciousPatterns: string[];
  riskScore: number;
  reason: string;
}

/** Known scam addresses (extend via threat intel) */
const ADDRESS_DENYLIST = new Set<string>([]);

export async function checkScamPatterns(
  address: PublicKey,
  metadata?: { name?: string; symbol?: string }
): Promise<ScamPatternsResult> {
  const addr = address.toBase58();
  const suspiciousPatterns: string[] = [];

  if (ADDRESS_DENYLIST.has(addr)) {
    return {
      isBlacklisted: true,
      matchesKnownScam: true,
      suspiciousPatterns: ['denylist'],
      riskScore: 50,
      reason: '🚨 Address is on the local scam denylist',
    };
  }

  if (metadata?.name) {
    const suspiciousNames = ['USDT', 'USDC', 'SOL', 'BTC', 'ETH', 'BONK'];
    const upper = metadata.name.toUpperCase();
    const isLookalike = suspiciousNames.some(
      (name) => upper.includes(name) && upper !== name && metadata.name !== name
    );
    if (isLookalike) {
      suspiciousPatterns.push('Name similar to a well-known token');
    }
  }

  if (metadata?.symbol) {
    const sym = metadata.symbol.toUpperCase();
    if (['USDT', 'USDC', 'SOL'].includes(sym) && !ADDRESS_DENYLIST.has(addr)) {
      // Symbol alone isn't enough; mild bump if mint unknown handled elsewhere
    }
  }

  if (suspiciousPatterns.length > 0) {
    return {
      isBlacklisted: false,
      matchesKnownScam: true,
      suspiciousPatterns,
      riskScore: 25,
      reason: `⚠️ ${suspiciousPatterns.join(', ')}`,
    };
  }

  return {
    isBlacklisted: false,
    matchesKnownScam: false,
    suspiciousPatterns: [],
    riskScore: 0,
    reason: 'No scam patterns detected',
  };
}
