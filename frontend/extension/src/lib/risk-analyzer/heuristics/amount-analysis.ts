/**
 * Amount Analysis — large SOL transfers raise risk
 * riskScore: additive 0–25
 */

export interface AmountAnalysisResult {
  isUnusual: boolean;
  isLarge: boolean;
  riskScore: number;
  reason?: string;
}

export async function analyzeAmount(amountLamports: number): Promise<AmountAnalysisResult> {
  const amountSol = amountLamports / 1e9;

  if (!Number.isFinite(amountSol) || amountSol <= 0) {
    return { isUnusual: false, isLarge: false, riskScore: 0 };
  }

  if (amountSol >= 100) {
    return {
      isUnusual: true,
      isLarge: true,
      riskScore: 25,
      reason: `Very large transfer: ${amountSol.toFixed(2)} SOL`,
    };
  }
  if (amountSol >= 10) {
    return {
      isUnusual: true,
      isLarge: true,
      riskScore: 15,
      reason: `Large transfer: ${amountSol.toFixed(2)} SOL`,
    };
  }
  if (amountSol >= 1) {
    return {
      isUnusual: false,
      isLarge: false,
      riskScore: 5,
      reason: `Transfer of ${amountSol.toFixed(2)} SOL`,
    };
  }

  return { isUnusual: false, isLarge: false, riskScore: 0 };
}
