/**
 * Transaction Parser - Extrai informações de transações Solana
 */

import { Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface ParsedTransaction {
  signature?: string;
  transactionHash?: string;
  type: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  programs: string[];
  accounts: string[];
  instructions: any[];
  metadata: {
    programIds: string[];
    accountCount: number;
    instructionCount: number;
    recentBlockhash?: string;
    feePayer?: string;
  };
}

const KNOWN_PROGRAMS: Record<string, string> = {
  [SystemProgram.programId.toBase58()]: 'System Program',
  [TOKEN_PROGRAM_ID.toBase58()]: 'Token Program',
  '11111111111111111111111111111111': 'System Program',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
  JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4: 'Jupiter Aggregator',
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: 'Orca Whirlpool',
};

function asBytes(data: any): Uint8Array | null {
  if (!data) return null;
  if (data instanceof Uint8Array) return data;
  if (Buffer.isBuffer?.(data)) return new Uint8Array(data);
  if (Array.isArray(data)) return Uint8Array.from(data);
  if (data?.type === 'Buffer' && Array.isArray(data.data)) return Uint8Array.from(data.data);
  if (typeof data === 'string') {
    try {
      const bin = atob(data);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch {
      return null;
    }
  }
  return null;
}

function readU32LE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(offset, true);
}

function readU64LE(bytes: Uint8Array, offset: number): bigint {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getBigUint64(offset, true);
}

function getSystemInstructionType(instruction: any): string {
  try {
    const bytes = asBytes(instruction.data);
    if (!bytes || bytes.length < 4) return 'Unknown';
    const instructionType = readU32LE(bytes, 0);
    switch (instructionType) {
      case 0:
        return 'CreateAccount';
      case 1:
        return 'Assign';
      case 2:
        return 'Transfer';
      case 3:
        return 'CreateAccountWithSeed';
      case 4:
        return 'AdvanceNonceAccount';
      case 5:
        return 'WithdrawNonceAccount';
      case 6:
        return 'InitializeNonceAccount';
      case 7:
        return 'AuthorizeNonceAccount';
      case 8:
        return 'Allocate';
      case 9:
        return 'AllocateWithSeed';
      case 10:
        return 'AssignWithSeed';
      case 11:
        return 'TransferWithSeed';
      default:
        return `Unknown(${instructionType})`;
    }
  } catch {
    return 'Unknown';
  }
}

function programIdStr(instruction: any): string {
  try {
    if (typeof instruction.programId?.toBase58 === 'function') {
      return instruction.programId.toBase58();
    }
    if (typeof instruction.programId === 'string') return instruction.programId;
  } catch {
    /* ignore */
  }
  return '';
}

function pubkeyStr(key: any): string | undefined {
  try {
    if (!key) return undefined;
    if (typeof key.toBase58 === 'function') return key.toBase58();
    if (typeof key.pubkey?.toBase58 === 'function') return key.pubkey.toBase58();
    if (typeof key === 'string') return key;
    if (typeof key.pubkey === 'string') return key.pubkey;
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Extract SOL/token transfer from a single instruction (lamports / raw units). */
function parseTransferInstruction(instruction: any): {
  from?: string;
  to?: string;
  amount?: string;
  kind?: 'sol' | 'token';
} {
  try {
    const pid = programIdStr(instruction);
    const keys = instruction.keys || [];

    if (pid === SystemProgram.programId.toBase58() || pid === '11111111111111111111111111111111') {
      const ixType = getSystemInstructionType(instruction);
      if (ixType === 'Transfer' && keys.length >= 2) {
        const from = pubkeyStr(keys[0]);
        const to = pubkeyStr(keys[1]);
        const bytes = asBytes(instruction.data);
        let amount: string | undefined;
        if (bytes && bytes.length >= 12) {
          try {
            amount = readU64LE(bytes, 4).toString();
          } catch (e) {
            console.warn('amount read failed', e);
          }
        }
        return { from, to, amount, kind: 'sol' };
      }
      if (ixType === 'TransferWithSeed' && keys.length >= 2) {
        const from = pubkeyStr(keys[0]);
        const to = pubkeyStr(keys[1]);
        const bytes = asBytes(instruction.data);
        let amount: string | undefined;
        // TransferWithSeed: u32 ix + u64 lamports + …
        if (bytes && bytes.length >= 12) {
          try {
            amount = readU64LE(bytes, 4).toString();
          } catch {
            /* ignore */
          }
        }
        return { from, to, amount, kind: 'sol' };
      }
    }

    if (pid === TOKEN_PROGRAM_ID.toBase58()) {
      const bytes = asBytes(instruction.data);
      const disc = bytes?.[0];
      // 3 = Transfer, 12 = TransferChecked
      if ((disc === 3 || disc === 12) && keys.length >= 2) {
        const from = pubkeyStr(keys[0]);
        const to = pubkeyStr(keys[1]);
        let amount: string | undefined;
        if (bytes && bytes.length >= 9) {
          try {
            amount = readU64LE(bytes, 1).toString();
          } catch {
            /* ignore */
          }
        }
        return { from, to, amount, kind: 'token' };
      }
    }
  } catch (error) {
    console.error('Error parsing transfer instruction:', error);
  }
  return {};
}

/**
 * Scan every instruction — ComputeBudget / ATAs often come before Transfer.
 */
function extractTransferFromInstructions(instructions: any[]): {
  type: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  tokenAddress?: string;
} {
  let transactionType = 'other';
  let fromAddress: string | undefined;
  let toAddress: string | undefined;
  let amount: string | undefined;
  let tokenAddress: string | undefined;

  for (const ix of instructions) {
    const pid = programIdStr(ix);
    if (pid === SystemProgram.programId.toBase58() || pid === '11111111111111111111111111111111') {
      const instructionType = getSystemInstructionType(ix);
      if (instructionType === 'Transfer' || instructionType === 'TransferWithSeed') {
        transactionType = 'transfer';
        const info = parseTransferInstruction(ix);
        fromAddress = info.from || fromAddress;
        toAddress = info.to || toAddress;
        if (info.amount && info.amount !== '0') amount = info.amount;
      }
    } else if (pid === TOKEN_PROGRAM_ID.toBase58()) {
      const info = parseTransferInstruction(ix);
      if (info.amount || info.from) {
        transactionType = 'transfer';
        fromAddress = info.from || fromAddress;
        toAddress = info.to || toAddress;
        if (info.amount && info.amount !== '0') amount = info.amount;
        if (ix.keys?.length > 0) tokenAddress = pubkeyStr(ix.keys[0]) || tokenAddress;
      }
    } else if (pid === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4') {
      transactionType = 'swap';
      if (ix.keys?.length >= 2) {
        fromAddress = fromAddress || pubkeyStr(ix.keys[0]);
        toAddress = toAddress || pubkeyStr(ix.keys[1]);
      }
    }
  }

  return { type: transactionType, fromAddress, toAddress, amount, tokenAddress };
}

export function parseTransaction(transaction: Transaction): ParsedTransaction {
  try {
    const instructions = transaction.instructions || [];
    const programs = instructions.map((ix) => programIdStr(ix)).filter(Boolean);
    const accounts = instructions.flatMap((ix) =>
      (ix.keys || []).map((k: any) => pubkeyStr(k)).filter(Boolean)
    ) as string[];

    const uniquePrograms = [...new Set(programs)];
    const uniqueAccounts = [...new Set(accounts)];

    const extracted = extractTransferFromInstructions(instructions);
    let { type: transactionType, fromAddress, toAddress, amount, tokenAddress } = extracted;

    if (!fromAddress && transaction.feePayer) {
      fromAddress = transaction.feePayer.toBase58();
    }

    if (!toAddress && instructions.length > 0) {
      for (const ix of instructions) {
        const firstWritable = (ix.keys || []).find(
          (k: any) => k.isWritable && pubkeyStr(k) !== fromAddress
        );
        if (firstWritable) {
          toAddress = pubkeyStr(firstWritable);
          break;
        }
      }
    }

    const transactionHash = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    console.log('📦 Parsed tx', {
      type: transactionType,
      fromAddress,
      toAddress,
      amount,
      instructionCount: instructions.length,
    });

    return {
      transactionHash,
      type: transactionType,
      fromAddress,
      toAddress,
      amount,
      tokenAddress,
      programs: uniquePrograms,
      accounts: uniqueAccounts,
      instructions: instructions.map((ix, index) => ({
        index,
        programId: programIdStr(ix),
        program: KNOWN_PROGRAMS[programIdStr(ix)] || 'Unknown',
        keys: (ix.keys || []).map((k: any) => ({
          pubkey: pubkeyStr(k),
          isSigner: !!k.isSigner,
          isWritable: !!k.isWritable,
        })),
        dataLength: asBytes(ix.data)?.length || 0,
      })),
      metadata: {
        programIds: uniquePrograms,
        accountCount: uniqueAccounts.length,
        instructionCount: instructions.length,
        recentBlockhash: transaction.recentBlockhash || undefined,
        feePayer: transaction.feePayer?.toBase58(),
      },
    };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return {
      type: 'unknown',
      programs: [],
      accounts: [],
      instructions: [],
      metadata: {
        programIds: [],
        accountCount: 0,
        instructionCount: 0,
      },
    };
  }
}
