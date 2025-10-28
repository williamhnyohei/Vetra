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

// Known program IDs
const KNOWN_PROGRAMS: Record<string, string> = {
  [SystemProgram.programId.toBase58()]: 'System Program',
  [TOKEN_PROGRAM_ID.toBase58()]: 'Token Program',
  '11111111111111111111111111111111': 'System Program',
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter Aggregator',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpool',
};

/**
 * Identifica o tipo de instrução do System Program
 */
function getSystemInstructionType(instruction: any): string {
  try {
    const data = instruction.data;
    if (!data || data.length === 0) return 'Unknown';
    
    const instructionType = data[0];
    
    switch (instructionType) {
      case 0: return 'CreateAccount';
      case 1: return 'Assign';
      case 2: return 'Transfer';
      case 3: return 'CreateAccountWithSeed';
      case 4: return 'AdvanceNonceAccount';
      case 5: return 'WithdrawNonceAccount';
      case 6: return 'InitializeNonceAccount';
      case 7: return 'AuthorizeNonceAccount';
      case 8: return 'Allocate';
      case 9: return 'AllocateWithSeed';
      case 10: return 'AssignWithSeed';
      case 11: return 'TransferWithSeed';
      default: return `Unknown(${instructionType})`;
    }
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Extrai informações de uma instrução de transferência
 */
function parseTransferInstruction(instruction: any): {
  from?: string;
  to?: string;
  amount?: string;
} {
  try {
    // Para System Program Transfer
    if (instruction.programId.equals(SystemProgram.programId)) {
      const keys = instruction.keys;
      if (keys.length >= 2) {
        return {
          from: keys[0].pubkey.toBase58(),
          to: keys[1].pubkey.toBase58(),
          amount: instruction.data ? instruction.data.readBigUInt64LE?.(1)?.toString() : undefined,
        };
      }
    }
    
    // Para Token Program Transfer
    if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
      const keys = instruction.keys;
      if (keys.length >= 3) {
        return {
          from: keys[0].pubkey.toBase58(), // Source account
          to: keys[1].pubkey.toBase58(),   // Destination account
          amount: instruction.data ? instruction.data.readBigUInt64LE?.(1)?.toString() : undefined,
        };
      }
    }
  } catch (error) {
    console.error('Error parsing transfer instruction:', error);
  }
  
  return {};
}

/**
 * Parseia uma transação Solana completa
 */
export function parseTransaction(transaction: Transaction): ParsedTransaction {
  try {
    const instructions = transaction.instructions || [];
    
    // Safely extract program IDs
    const programs = instructions.map(ix => {
      try {
        return ix.programId?.toBase58 ? ix.programId.toBase58() : ix.programId?.toString() || 'Unknown';
      } catch (e) {
        return 'Unknown';
      }
    });
    
    // Safely extract accounts
    const accounts = instructions.flatMap(ix => {
      try {
        return (ix.keys || []).map(k => {
          try {
            return k.pubkey?.toBase58 ? k.pubkey.toBase58() : k.pubkey?.toString() || 'Unknown';
          } catch (e) {
            return 'Unknown';
          }
        });
      } catch (e) {
        return [];
      }
    });
    
    // Remove duplicatas
    const uniquePrograms = [...new Set(programs)];
    const uniqueAccounts = [...new Set(accounts)];
    
    // Identifica o tipo de transação baseado nos programas usados
    let transactionType = 'Unknown';
    let fromAddress: string | undefined;
    let toAddress: string | undefined;
    let amount: string | undefined;
    let tokenAddress: string | undefined;
    
    // Analisa a primeira instrução para determinar o tipo
    if (instructions.length > 0) {
      const firstInstruction = instructions[0];
      const programId = firstInstruction.programId?.toBase58 ? 
        firstInstruction.programId.toBase58() : 
        firstInstruction.programId?.toString() || 'Unknown';
      
      if (programId === SystemProgram.programId.toBase58()) {
        const instructionType = getSystemInstructionType(firstInstruction);
        transactionType = instructionType;
        
        if (instructionType === 'Transfer') {
          const transferInfo = parseTransferInstruction(firstInstruction);
          fromAddress = transferInfo.from;
          toAddress = transferInfo.to;
          amount = transferInfo.amount;
        }
      } else if (programId === TOKEN_PROGRAM_ID.toBase58()) {
        transactionType = 'TokenTransfer';
        const transferInfo = parseTransferInstruction(firstInstruction);
        fromAddress = transferInfo.from;
        toAddress = transferInfo.to;
        amount = transferInfo.amount;
        
        // Tenta identificar o token
        if (firstInstruction.keys.length > 0) {
          tokenAddress = firstInstruction.keys[0].pubkey.toBase58();
        }
      } else if (KNOWN_PROGRAMS[programId]) {
        transactionType = KNOWN_PROGRAMS[programId];
      }
    }
    
    // Gera um hash temporário para a transação (será substituído pela signature real após envio)
    const transactionHash = `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    return {
      transactionHash,
      type: transactionType,
      fromAddress,
      toAddress,
      amount,
      tokenAddress,
      programs: uniquePrograms,
      accounts: uniqueAccounts,
      instructions: instructions.map((ix, index) => {
        const programId = ix.programId?.toBase58 ? ix.programId.toBase58() : ix.programId?.toString() || 'Unknown';
        return {
          index,
          programId,
          program: KNOWN_PROGRAMS[programId] || 'Unknown',
          keys: (ix.keys || []).map(k => ({
            pubkey: k.pubkey?.toBase58 ? k.pubkey.toBase58() : k.pubkey?.toString() || 'Unknown',
            isSigner: k.isSigner || false,
            isWritable: k.isWritable || false,
          })),
          dataLength: ix.data?.length || 0,
        };
      }),
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
      type: 'Error',
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

