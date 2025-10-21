/**
 * Transaction Parser - Extrai informações de transações Solana
 */

import type { Transaction, PublicKey } from '@solana/web3.js';

export interface ParsedTransaction {
  type: string;
  from?: PublicKey;
  to?: PublicKey;
  amount?: number;
  token?: PublicKey;
  programs: PublicKey[];
  accounts: PublicKey[];
}

/**
 * Parseia uma transação Solana
 */
export function parseTransaction(transaction: Transaction): ParsedTransaction {
  // TODO: Implementar parsing completo
  // - Identificar tipo de transação (transfer, swap, etc)
  // - Extrair contas envolvidas
  // - Extrair valores
  // - Identificar programas chamados
  
  const instructions = transaction.instructions;
  const programs = instructions.map(ix => ix.programId);
  const accounts = instructions.flatMap(ix => ix.keys.map(k => k.pubkey));
  
  return {
    type: 'Unknown',
    programs,
    accounts,
  };
}

