export interface Transaction {
  id: string;
  signature?: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  token?: string;
  riskScore: number;
  riskReasons: string[];
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface RiskAnalysis {
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  heuristics: {
    tokenCheck: boolean;
    programCheck: boolean;
    accountReputation: number;
    amountAnalysis: boolean;
  };
}

export interface Attestation {
  id: string;
  provider: string;
  providerPubkey: string;
  transactionHash: string;
  riskScore: number;
  reputation: number;
  stake: number;
  timestamp: number;
  verified: boolean;
}

