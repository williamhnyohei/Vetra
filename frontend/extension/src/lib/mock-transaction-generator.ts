// Simulador de transações para demonstração
// Gera transações com valores e riscos oscilantes

export interface SimulatedTransaction {
  from: string;
  to: string;
  amount: number;
  token: string;
  network: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskReasons: string[];
  timestamp: Date;
}

const TOKENS = ['SOL', 'USDC', 'USDT', 'RAY', 'SRM', 'ORCA'];

const RISK_SCENARIOS = [
  {
    level: 'low' as const,
    scoreRange: [0, 30],
    reasons: [
      'Endereço conhecido e verificado',
      'Transação de valor normal',
      'Destinatário possui boa reputação',
      'Sem sinais de phishing'
    ]
  },
  {
    level: 'medium' as const,
    scoreRange: [31, 60],
    reasons: [
      'Endereço novo sem histórico',
      'Valor acima da média',
      'Contrato não auditado',
      'Atividade recente suspeita no destino'
    ]
  },
  {
    level: 'high' as const,
    scoreRange: [61, 85],
    reasons: [
      'Endereço associado a múltiplos scams',
      'Padrão similar a rugpull',
      'Site usa técnicas de phishing',
      'Valor muito alto para conta nova'
    ]
  },
  {
    level: 'critical' as const,
    scoreRange: [86, 100],
    reasons: [
      '🚨 SCAM CONFIRMADO - Endereço em blacklist',
      '🚨 Site de phishing detectado',
      '🚨 Contrato malicioso identificado',
      '🚨 Tentativa de drenagem de carteira'
    ]
  }
];

const KNOWN_ADDRESSES = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',  // SRM
];

const SUSPICIOUS_ADDRESSES = [
  'Scam1111111111111111111111111111111111111',
  'Phish222222222222222222222222222222222222',
  'Rugpu333333333333333333333333333333333333',
  'Drain444444444444444444444444444444444444',
];

/**
 * Gera um endereço Solana fake aleatório
 */
function generateRandomAddress(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let address = '';
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Gera um valor aleatório com distribuição realista
 */
function generateAmount(token: string): number {
  if (token === 'SOL') {
    // SOL: 0.01 a 100
    return Math.random() * 100 + 0.01;
  } else if (token === 'USDC' || token === 'USDT') {
    // Stablecoins: 1 a 10000
    return Math.random() * 10000 + 1;
  } else {
    // Outros tokens: 10 a 100000
    return Math.random() * 100000 + 10;
  }
}

/**
 * Seleciona um cenário de risco aleatório com pesos
 */
function selectRiskScenario() {
  // Pesos: 50% low, 30% medium, 15% high, 5% critical
  const rand = Math.random() * 100;
  
  if (rand < 50) return RISK_SCENARIOS[0]; // low
  if (rand < 80) return RISK_SCENARIOS[1]; // medium
  if (rand < 95) return RISK_SCENARIOS[2]; // high
  return RISK_SCENARIOS[3]; // critical
}

/**
 * Gera uma transação simulada com valores oscilantes
 */
export function generateSimulatedTransaction(fromAddress: string): SimulatedTransaction {
  const scenario = selectRiskScenario();
  const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
  const amount = generateAmount(token);
  
  // Escolhe endereço de destino baseado no risco
  let toAddress: string;
  if (scenario.level === 'low') {
    // 70% chance de ser endereço conhecido
    toAddress = Math.random() < 0.7 
      ? KNOWN_ADDRESSES[Math.floor(Math.random() * KNOWN_ADDRESSES.length)]
      : generateRandomAddress();
  } else if (scenario.level === 'critical') {
    // Sempre endereço suspeito
    toAddress = SUSPICIOUS_ADDRESSES[Math.floor(Math.random() * SUSPICIOUS_ADDRESSES.length)];
  } else {
    // Endereço aleatório
    toAddress = generateRandomAddress();
  }
  
  // Score dentro do range do cenário
  const [minScore, maxScore] = scenario.scoreRange;
  const riskScore = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
  
  // Seleciona 2-3 razões aleatórias do cenário
  const numReasons = Math.floor(Math.random() * 2) + 2; // 2 ou 3
  const shuffledReasons = [...scenario.reasons].sort(() => Math.random() - 0.5);
  const selectedReasons = shuffledReasons.slice(0, numReasons);
  
  return {
    from: fromAddress,
    to: toAddress,
    amount: parseFloat(amount.toFixed(6)),
    token,
    network: 'devnet',
    riskScore,
    riskLevel: scenario.level,
    riskReasons: selectedReasons,
    timestamp: new Date()
  };
}

/**
 * Gera múltiplas transações simuladas
 */
export function generateSimulatedTransactions(fromAddress: string, count: number): SimulatedTransaction[] {
  const transactions: SimulatedTransaction[] = [];
  for (let i = 0; i < count; i++) {
    transactions.push(generateSimulatedTransaction(fromAddress));
  }
  return transactions;
}

/**
 * Gera hash de transação realista (64 caracteres hex)
 */
function generateTransactionHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Formata transação para envio ao backend
 */
export function formatTransactionForBackend(tx: SimulatedTransaction) {
  return {
    transaction_hash: generateTransactionHash(),
    from_address: tx.from,
    to_address: tx.to,
    amount: tx.amount.toString(),
    token: tx.token,
    network: tx.network,
    status: 'pending',
    metadata: JSON.stringify({
      generated_at: tx.timestamp.toISOString(),
      risk_score: tx.riskScore,
      risk_level: tx.riskLevel,
      risk_reasons: tx.riskReasons
    })
  };
}

