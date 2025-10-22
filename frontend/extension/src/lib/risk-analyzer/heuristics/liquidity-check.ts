/**
 * Liquidity Check - Verifica liquidez do token
 * BP: "Liquidez (baixa ou não travada)"
 */

import type { PublicKey } from '@solana/web3.js';

export interface LiquidityResult {
  liquidityUsd: number;
  isLiquidityLocked: boolean;
  lockEndDate?: Date;
  isLow: boolean;
  riskScore: number;
  reason: string;
}

/**
 * Verifica a liquidez de um token
 * Baixa liquidez ou liquidez não travada = maior risco de rugpull
 */
export async function checkLiquidity(
  tokenMint: PublicKey
): Promise<LiquidityResult> {
  // TODO: Implementar verificação real
  // - Consultar pools de liquidez (Raydium, Orca, etc)
  // - Verificar se há lock de liquidez
  // - Verificar valor total da liquidez
  
  // Mock temporário
  const liquidityUsd = 5000; // USD
  const isLiquidityLocked = false;
  const isLow = liquidityUsd < 10000;
  
  let riskScore = 80;
  let reason = 'Liquidez adequada e travada';
  
  if (!isLiquidityLocked && isLow) {
    riskScore = 25;
    reason = `⚠️ PERIGO: Liquidez baixa (US$ ${liquidityUsd.toLocaleString()}) e NÃO TRAVADA - Alto risco de rugpull!`;
  } else if (!isLiquidityLocked) {
    riskScore = 45;
    reason = `⚠️ Liquidez NÃO está travada - Pode ser removida a qualquer momento`;
  } else if (isLow) {
    riskScore = 60;
    reason = `Liquidez baixa (US$ ${liquidityUsd.toLocaleString()}), mas está travada`;
  }
  
  return {
    liquidityUsd,
    isLiquidityLocked,
    isLow,
    riskScore,
    reason,
  };
}


