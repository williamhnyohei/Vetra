/**
 * Attestation Fetcher — backend + optional on-chain PDA lookup
 */

import type { PublicKey } from '@solana/web3.js';
import type { Attestation } from '../../types/transaction';
import ApiService from '../../services/api-service';

/**
 * Busca attestations para uma transação (via backend API)
 */
export async function fetchAttestations(
  transactionHash: Uint8Array | string
): Promise<Attestation[]> {
  const hash =
    typeof transactionHash === 'string'
      ? transactionHash
      : Array.from(transactionHash)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');

  try {
    const api = ApiService.getInstance();
    const res = await api.getAttestations(hash);
    return (res.attestations || []).map((a: any) => ({
      id: String(a.id),
      provider: a.provider_pubkey || a.provider || '',
      providerPubkey: a.provider_pubkey || a.provider || '',
      transactionHash: a.transaction_hash || hash,
      riskScore: a.risk_score ?? 0,
      reputation: a.reputation ?? 0,
      stake: parseFloat(a.stake_amount || '0'),
      timestamp: new Date(a.created_at || Date.now()).getTime(),
      verified: Boolean(a.verified),
    }));
  } catch (e) {
    console.warn('fetchAttestations failed:', e);
    return [];
  }
}

/**
 * Busca attestations de um provider específico
 */
export async function fetchProviderAttestations(
  provider: PublicKey
): Promise<Attestation[]> {
  try {
    const api = ApiService.getInstance();
    const query = new URLSearchParams({ providerPubkey: provider.toBase58() });
    const data = await (api as any).request?.(`/attestations?${query}`) ??
      { attestations: [] };
    const list = data.attestations ?? data.data?.attestations ?? [];
    return list.map((a: any) => ({
      id: String(a.id),
      provider: a.provider_pubkey || provider.toBase58(),
      providerPubkey: a.provider_pubkey || provider.toBase58(),
      transactionHash: a.transaction_hash || '',
      riskScore: a.risk_score ?? 0,
      reputation: a.reputation ?? 0,
      stake: parseFloat(a.stake_amount || '0'),
      timestamp: new Date(a.created_at || Date.now()).getTime(),
      verified: Boolean(a.verified),
    }));
  } catch {
    return [];
  }
}
