/**
 * Risk Analysis Hook
 * Custom hook for analyzing transactions using the Multi-Agent System
 */

import { useState, useCallback } from 'react';
import ApiService, { TransactionData, RiskAnalysis } from '../services/api-service';

interface UseRiskAnalysisReturn {
  analysis: RiskAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeTransaction: (transactionData: TransactionData) => Promise<void>;
  clearAnalysis: () => void;
}

export function useRiskAnalysis(): UseRiskAnalysisReturn {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeTransaction = useCallback(async (transactionData: TransactionData) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      console.log('🔍 Analyzing transaction with MAS:', transactionData);

      const apiService = ApiService.getInstance();
      const response = await apiService.analyzeTransaction(transactionData);

      if (response.success) {
        setAnalysis(response.analysis);
        console.log('✅ Analysis complete:', response.analysis);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err: any) {
      console.error('❌ Analysis error:', err);
      setError(err.message || 'Failed to analyze transaction');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeTransaction,
    clearAnalysis,
  };
}
