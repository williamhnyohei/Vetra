/**
 * Scam Patterns Check - Verifica padrões conhecidos de golpes
 * BP: "Blacklist/similaridade com padrões de scams conhecidos"
 */

import type { PublicKey } from '@solana/web3.js';

export interface ScamPatternsResult {
  isBlacklisted: boolean;
  matchesKnownScam: boolean;
  suspiciousPatterns: string[];
  riskScore: number;
  reason: string;
}

/**
 * Verifica se token/contrato está em blacklist ou segue padrões de scams
 */
export async function checkScamPatterns(
  address: PublicKey,
  metadata?: any
): Promise<ScamPatternsResult> {
  // TODO: Implementar verificação real
  // - Consultar blacklists conhecidas (RugCheck, Solscan, etc)
  // - Verificar padrões comuns de scams:
  //   * Nome similar a tokens famosos
  //   * Metadata suspeita
  //   * Contratos copiados
  //   * Histórico de creator
  
  const suspiciousPatterns: string[] = [];
  
  // Mock: verificações básicas
  const isBlacklisted = false;
  const matchesKnownScam = false;
  
  // Exemplo: verificar nome suspeito
  if (metadata?.name) {
    const suspiciousNames = ['USDT', 'USDC', 'SOL', 'BTC', 'ETH'];
    const isSuspicious = suspiciousNames.some(name => 
      metadata.name.toUpperCase().includes(name) && 
      metadata.name !== name
    );
    if (isSuspicious) {
      suspiciousPatterns.push('Nome similar a token famoso');
    }
  }
  
  let riskScore = 80;
  let reason = 'Nenhum padrão de golpe detectado';
  
  if (isBlacklisted) {
    riskScore = 0;
    reason = '🚨 BLOQUEADO: Token está em BLACKLIST conhecida!';
  } else if (matchesKnownScam) {
    riskScore = 15;
    reason = '🚨 PERIGO: Padrão similar a golpes conhecidos!';
  } else if (suspiciousPatterns.length > 0) {
    riskScore = 40;
    reason = `⚠️ Atenção: ${suspiciousPatterns.join(', ')}`;
  }
  
  return {
    isBlacklisted,
    matchesKnownScam,
    suspiciousPatterns,
    riskScore,
    reason,
  };
}


