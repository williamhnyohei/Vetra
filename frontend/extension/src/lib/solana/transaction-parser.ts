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
      console.log('🔍 System Program Transfer - Keys:', keys.length);
      
      if (keys.length >= 2) {
        const from = keys[0].pubkey.toBase58();
        const to = keys[1].pubkey.toBase58();
        
        // Try to extract amount from instruction data
        let amount: string | undefined;
        if (instruction.data && instruction.data.length >= 12) {
          try {
            // SystemProgram Transfer: u32 instruction index + u64 lamports
            // Skip first 4 bytes (instruction index), read next 8 bytes (amount)
            const dataBuffer = Buffer.from(instruction.data);
            const lamports = dataBuffer.readBigUInt64LE(4);
            amount = lamports.toString();
            console.log('💰 Extracted amount (lamports):', amount);
          } catch (error) {
            console.error('Error reading amount from buffer:', error);
          }
        }
        
        console.log('📤 From:', from);
        console.log('📥 To:', to);
        
        return { from, to, amount };
      }
    }
    
    // Para Token Program Transfer
    if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
      const keys = instruction.keys;
      console.log('🔍 Token Program Transfer - Keys:', keys.length);
      
      if (keys.length >= 3) {
        const from = keys[0].pubkey.toBase58();
        const to = keys[1].pubkey.toBase58();
        
        let amount: string | undefined;
        if (instruction.data && instruction.data.length >= 9) {
          try {
            const dataBuffer = Buffer.from(instruction.data);
            const tokens = dataBuffer.readBigUInt64LE(1);
            amount = tokens.toString();
            console.log('💰 Extracted token amount:', amount);
          } catch (error) {
            console.error('Error reading token amount from buffer:', error);
          }
        }
        
        console.log('📤 From (token account):', from);
        console.log('📥 To (token account):', to);
        
        return { from, to, amount };
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
    const instructions = transaction.instructions;
    const programs = instructions.map(ix => ix.programId.toBase58());
    const accounts = instructions.flatMap(ix => ix.keys.map(k => k.pubkey.toBase58()));
    
    // Remove duplicatas
    const uniquePrograms = [...new Set(programs)];
    const uniqueAccounts = [...new Set(accounts)];
    
    // Identifica o tipo de transação baseado nos programas usados
    let transactionType = 'other'; // Default to 'other' (valid DB enum value)
    let fromAddress: string | undefined;
    let toAddress: string | undefined;
    let amount: string | undefined;
    let tokenAddress: string | undefined;
    
    // Analisa a primeira instrução para determinar o tipo
    if (instructions.length > 0) {
      const firstInstruction = instructions[0];
      const programId = firstInstruction.programId.toBase58();
      
      console.log('🔍 Analyzing instruction with programId:', programId);
      
      if (programId === SystemProgram.programId.toBase58()) {
        const instructionType = getSystemInstructionType(firstInstruction);
        console.log('📋 System instruction type:', instructionType);
        
        // Map system instruction types to DB enum values
        if (instructionType === 'Transfer' || instructionType.toLowerCase() === 'transfer') {
          transactionType = 'transfer';
        } else {
          transactionType = 'other';
        }
        
        if (instructionType === 'Transfer') {
          const transferInfo = parseTransferInstruction(firstInstruction);
          fromAddress = transferInfo.from;
          toAddress = transferInfo.to;
          amount = transferInfo.amount;
        }
      } else if (programId === TOKEN_PROGRAM_ID.toBase58()) {
        transactionType = 'transfer'; // Token transfer is still a transfer
        const transferInfo = parseTransferInstruction(firstInstruction);
        fromAddress = transferInfo.from;
        toAddress = transferInfo.to;
        amount = transferInfo.amount;
        
        // Tenta identificar o token
        if (firstInstruction.keys.length > 0) {
          tokenAddress = firstInstruction.keys[0].pubkey.toBase58();
        }
      } else if (programId === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4') {
        // Jupiter = swap
        transactionType = 'swap';
        
        // Try to extract addresses from Jupiter swap
        if (firstInstruction.keys.length >= 2) {
          fromAddress = firstInstruction.keys[0].pubkey.toBase58();
          toAddress = firstInstruction.keys[1].pubkey.toBase58();
        }
      } else if (KNOWN_PROGRAMS[programId]) {
        transactionType = 'other'; // Other known programs
      }
    }
    
    // Fallback: use feePayer as fromAddress if not set
    if (!fromAddress && transaction.feePayer) {
      fromAddress = transaction.feePayer.toBase58();
      console.log('⚠️ Using feePayer as fromAddress:', fromAddress);
    }
    
    // Fallback: use first writable account as toAddress if not set
    if (!toAddress && instructions.length > 0) {
      const firstWritableKey = instructions[0].keys.find(k => k.isWritable && k.pubkey.toBase58() !== fromAddress);
      if (firstWritableKey) {
        toAddress = firstWritableKey.pubkey.toBase58();
        console.log('⚠️ Using first writable account as toAddress:', toAddress);
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
      instructions: instructions.map((ix, index) => ({
        index,
        programId: ix.programId.toBase58(),
        program: KNOWN_PROGRAMS[ix.programId.toBase58()] || 'Unknown',
        keys: ix.keys.map(k => ({
          pubkey: k.pubkey.toBase58(),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        dataLength: ix.data?.length || 0,
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

