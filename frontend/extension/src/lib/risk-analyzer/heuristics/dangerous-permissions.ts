/**
 * Dangerous Permissions Check - Verifica permissões perigosas
 * BP: "Permissões perigosas (ex.: gasto ilimitado)"
 */

import type { Transaction } from '@solana/web3.js';

export interface DangerousPermissionsResult {
  hasUnlimitedSpending: boolean;
  hasAuthorityTransfer: boolean;
  hasCloseAccount: boolean;
  permissions: string[];
  riskScore: number;
  reason: string;
}

/**
 * Analisa permissões solicitadas pela transação
 * Identifica permissões perigosas como gasto ilimitado
 */
export async function checkDangerousPermissions(
  transaction: Transaction
): Promise<DangerousPermissionsResult> {
  // TODO: Implementar análise real de instruções
  // - Verificar se há approve com valor MAX_UINT
  // - Verificar se transfere autoridade da conta
  // - Verificar se fecha contas
  
  // Mock temporário
  const hasUnlimitedSpending = false;
  const hasAuthorityTransfer = false;
  const hasCloseAccount = false;
  const permissions: string[] = [];
  
  let riskScore = 80;
  let reason = 'Permissões padrão';
  
  if (hasUnlimitedSpending) {
    permissions.push('Gasto Ilimitado');
    riskScore = 20;
    reason = '⚠️ CUIDADO: Solicita permissão de GASTO ILIMITADO!';
  }
  
  if (hasAuthorityTransfer) {
    permissions.push('Transferência de Autoridade');
    riskScore = Math.min(riskScore, 30);
    reason = '⚠️ CUIDADO: Solicita transferência de autoridade da sua conta!';
  }
  
  if (hasCloseAccount) {
    permissions.push('Fechar Conta');
    riskScore = Math.min(riskScore, 40);
  }
  
  return {
    hasUnlimitedSpending,
    hasAuthorityTransfer,
    hasCloseAccount,
    permissions,
    riskScore,
    reason,
  };
}


