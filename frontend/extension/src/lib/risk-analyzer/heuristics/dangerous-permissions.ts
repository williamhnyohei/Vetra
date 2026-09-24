/**
 * Dangerous Permissions — unlimited approve / authority transfer / close account
 * riskScore: additive contribution (0–45), higher = riskier
 */

import type { Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface DangerousPermissionsResult {
  hasUnlimitedSpending: boolean;
  hasAuthorityTransfer: boolean;
  hasCloseAccount: boolean;
  permissions: string[];
  riskScore: number;
  reason: string;
}

const U64_MAX = BigInt('18446744073709551615');

export async function checkDangerousPermissions(
  transaction: Transaction
): Promise<DangerousPermissionsResult> {
  let hasUnlimitedSpending = false;
  let hasAuthorityTransfer = false;
  let hasCloseAccount = false;
  const permissions: string[] = [];

  for (const ix of transaction.instructions || []) {
    try {
      if (!ix.programId?.equals?.(TOKEN_PROGRAM_ID)) continue;
      const data: Uint8Array = ix.data;
      if (!data || data.length === 0) continue;

      const op = data[0];
      // Token Program: Approve=4, ApproveChecked=13, SetAuthority=6, CloseAccount=9
      if ((op === 4 || op === 13) && data.length >= 9) {
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const amount = view.getBigUint64(1, true);
        // Treat near-max as unlimited
        if (amount > U64_MAX / BigInt(2) || amount === U64_MAX) {
          hasUnlimitedSpending = true;
        }
      }
      if (op === 6) {
        hasAuthorityTransfer = true;
      }
      if (op === 9) {
        hasCloseAccount = true;
      }
    } catch {
      /* ignore malformed */
    }
  }

  let riskScore = 0;
  const notes: string[] = [];

  if (hasUnlimitedSpending) {
    permissions.push('Unlimited spending approval');
    riskScore += 35;
    notes.push('Unlimited token approval detected');
  }
  if (hasAuthorityTransfer) {
    permissions.push('Authority transfer');
    riskScore += 30;
    notes.push('Account authority transfer requested');
  }
  if (hasCloseAccount) {
    permissions.push('Close account');
    riskScore += 15;
    notes.push('Close account instruction present');
  }

  return {
    hasUnlimitedSpending,
    hasAuthorityTransfer,
    hasCloseAccount,
    permissions,
    riskScore,
    reason: notes.length ? `⚠️ ${notes.join('; ')}` : 'No dangerous permissions detected',
  };
}
