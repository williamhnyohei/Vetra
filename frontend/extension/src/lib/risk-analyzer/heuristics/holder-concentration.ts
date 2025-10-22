/**
 * Holder Concentration Check - Verifica concentração de holders
 * BP: "Concentração de holders (poucas carteiras concentram o supply)"
 */

import type { PublicKey } from '@solana/web3.js';

export interface HolderConcentrationResult {
  topHoldersPercentage: number; // % do supply nos top 10 holders
  numberOfHolders: number;
  isHighlyConcentrated: boolean;
  riskScore: number;
  reason: string;
}

/**
 * Analisa a distribuição de holders de um token
 * Alta concentração = maior risco de manipulação/dump
 */
export async function checkHolderConcentration(
  tokenMint: PublicKey
): Promise<HolderConcentrationResult> {
  // TODO: Implementar verificação real
  // - Buscar top holders via RPC ou APIs (Helius, QuickNode)
  // - Calcular % do supply nos top 10/20 holders
  // - Excluir addresses conhecidas (pools, burn, etc)
  
  // Mock temporário
  const topHoldersPercentage = 75; // 75% do supply nos top 10
  const numberOfHolders = 150;
  const isHighlyConcentrated = topHoldersPercentage > 50;
  
  let riskScore = 80;
  let reason = 'Distribuição saudável de holders';
  
  if (topHoldersPercentage > 70) {
    riskScore = 25;
    reason = `🚨 PERIGO: ${topHoldersPercentage}% do supply concentrado em poucas carteiras - Alto risco de dump!`;
  } else if (topHoldersPercentage > 50) {
    riskScore = 45;
    reason = `⚠️ ${topHoldersPercentage}% do supply concentrado - Possível manipulação`;
  } else if (numberOfHolders < 100) {
    riskScore = 60;
    reason = `Poucos holders (${numberOfHolders}) - Token ainda em fase inicial`;
  }
  
  return {
    topHoldersPercentage,
    numberOfHolders,
    isHighlyConcentrated,
    riskScore,
    reason,
  };
}


