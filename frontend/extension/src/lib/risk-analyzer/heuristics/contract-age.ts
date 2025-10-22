/**
 * Contract Age Check - Verifica idade do contrato/token
 * BP: "Idade do contrato (muito recente = mais risco)"
 */

import type { PublicKey } from '@solana/web3.js';

export interface ContractAgeResult {
  ageInDays: number;
  isVeryNew: boolean; // < 7 dias
  isNew: boolean; // < 30 dias
  riskScore: number;
  reason: string;
}

/**
 * Verifica a idade de um contrato/token
 * Contratos muito recentes são mais arriscados
 */
export async function checkContractAge(
  contractAddress: PublicKey
): Promise<ContractAgeResult> {
  // TODO: Implementar verificação real via Solana RPC
  // - Buscar primeira transação do contrato
  // - Calcular idade em dias
  
  // Mock temporário
  const ageInDays = 2; // Exemplo: 2 dias
  const isVeryNew = ageInDays < 7;
  const isNew = ageInDays < 30;
  
  let riskScore = 80; // Base
  let reason = 'Contrato estabelecido';
  
  if (isVeryNew) {
    riskScore = 30;
    reason = `Contrato criado há apenas ${ageInDays} dia${ageInDays > 1 ? 's' : ''} (ALTO RISCO)`;
  } else if (isNew) {
    riskScore = 60;
    reason = `Contrato relativamente novo (${ageInDays} dias)`;
  }
  
  return {
    ageInDays,
    isVeryNew,
    isNew,
    riskScore,
    reason,
  };
}


