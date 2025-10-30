/**
 * API Service
 * Handles all API calls to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://vetra-production.up.railway.app/api';

export interface TransactionData {
  signature?: string;
  type: string;
  from: string;
  to: string;
  amount: string;
  token?: string;
  timestamp?: number;
  instructions?: any[];
}

export interface RiskAnalysis {
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  heuristics: {
    addressReputation?: number;
    transactionPattern?: number;
    amountRisk?: number;
    velocityRisk?: number;
  };
  agentAnalysis?: {
    addressAgent?: any;
    patternAgent?: any;
    mlAgent?: any;
    consensusAgent?: any;
  };
  recommendations: string[];
  confidence: number;
}

export interface AnalysisResponse {
  success: boolean;
  analysis: RiskAnalysis;
  transaction?: {
    id: string;
    risk_score: number;
    risk_level: string;
    status: string;
  };
  cached?: boolean;
}

export interface TransactionHistory {
  id: string;
  signature: string;
  type: string;
  from_address: string;
  to_address: string;
  amount: string;
  risk_score: number;
  risk_level: string;
  status: string;
  analyzed_at: string;
  created_at: string;
}

export interface RiskStats {
  total_transactions: number;
  avg_risk_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  approved_count: number;
  rejected_count: number;
}

class ApiService {
  private static instance: ApiService;
  private authToken: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Add auth token if available
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    console.log('🌐 API Request:', url, config);

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ API Response:', data);
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  /**
   * Analyze transaction using Multi-Agent System
   */
  public async analyzeTransaction(
    transactionData: TransactionData
  ): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>('/transactions/analyze', {
      method: 'POST',
      body: JSON.stringify({ transactionData }),
    });
  }

  /**
   * Get transaction history
   */
  public async getTransactionHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
    riskLevel?: string;
  }): Promise<{
    success: boolean;
    transactions: TransactionHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.riskLevel) queryParams.append('riskLevel', params.riskLevel);

    return this.request(`/transactions/history?${queryParams.toString()}`);
  }

  /**
   * Get transaction details
   */
  public async getTransactionDetails(
    transactionId: string
  ): Promise<{
    success: boolean;
    transaction: TransactionHistory;
  }> {
    return this.request(`/transactions/${transactionId}`);
  }

  /**
   * Update transaction status
   */
  public async updateTransactionStatus(
    transactionId: string,
    status: 'approved' | 'rejected' | 'pending'
  ): Promise<{
    success: boolean;
    transaction: TransactionHistory;
  }> {
    return this.request(`/transactions/${transactionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Get risk statistics
   */
  public async getRiskStats(): Promise<{
    success: boolean;
    stats: RiskStats;
  }> {
    return this.request('/transactions/stats/risk');
  }

  /**
   * Create attestation
   */
  public async createAttestation(params: {
    transactionHash: string;
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    evidence?: any;
    stakeAmount: string;
  }): Promise<{
    success: boolean;
    attestation: any;
    signature: string;
  }> {
    return this.request('/attestations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get attestations for transaction
   */
  public async getAttestations(
    transactionHash: string
  ): Promise<{
    success: boolean;
    attestations: any[];
  }> {
    return this.request(`/attestations/${transactionHash}`);
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    services?: {
      database?: string;
      redis?: string;
      solana?: string;
    };
  }> {
    return this.request('/health');
  }

  /**
   * Upgrade to Pro plan
   */
  public async upgradeToPro(): Promise<{
    success: boolean;
    message: string;
    user: {
      id: string;
      email: string;
      subscription_plan: string;
      subscription_expires_at: string;
    };
  }> {
    return this.request('/users/upgrade-to-pro', {
      method: 'POST',
    });
  }
}

export default ApiService;
