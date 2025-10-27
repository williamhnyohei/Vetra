/**
 * Transaction Analyzer Component
 * Example component showing how to use the MAS API
 */

import React, { useState } from 'react';
import { useRiskAnalysis } from '../hooks/useRiskAnalysis';
import { TransactionData } from '../services/api-service';

export const TransactionAnalyzer: React.FC = () => {
  const { analysis, isAnalyzing, error, analyzeTransaction } = useRiskAnalysis();
  const [transactionData, setTransactionData] = useState<TransactionData>({
    type: 'transfer',
    from: '',
    to: '',
    amount: '',
    token: 'SOL',
  });

  const handleAnalyze = async () => {
    if (!transactionData.from || !transactionData.to || !transactionData.amount) {
      alert('Please fill in all fields');
      return;
    }

    await analyzeTransaction(transactionData);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-500';
      case 'medium':
        return 'text-yellow-500';
      case 'high':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 border-green-500';
      case 'medium':
        return 'bg-yellow-100 border-yellow-500';
      case 'high':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-gray-100 border-gray-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Transaction Risk Analyzer</h2>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">From Address</label>
          <input
            type="text"
            value={transactionData.from}
            onChange={(e) =>
              setTransactionData({ ...transactionData, from: e.target.value })
            }
            placeholder="Sender address"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To Address</label>
          <input
            type="text"
            value={transactionData.to}
            onChange={(e) =>
              setTransactionData({ ...transactionData, to: e.target.value })
            }
            placeholder="Recipient address"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="text"
            value={transactionData.amount}
            onChange={(e) =>
              setTransactionData({ ...transactionData, amount: e.target.value })
            }
            placeholder="0.0"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={`w-full py-3 rounded-lg font-semibold ${
            isAnalyzing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Transaction'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-500 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className={`p-4 border-2 rounded-lg ${getRiskBgColor(analysis.level)}`}>
          <h3 className="text-xl font-bold mb-2">Risk Analysis Results</h3>

          {/* Risk Score */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold">Risk Score:</span>
              <span className={`text-2xl font-bold ${getRiskColor(analysis.level)}`}>
                {analysis.score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  analysis.level === 'low'
                    ? 'bg-green-500'
                    : analysis.level === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>

          {/* Risk Level */}
          <div className="mb-4">
            <span className="font-semibold">Risk Level: </span>
            <span className={`font-bold uppercase ${getRiskColor(analysis.level)}`}>
              {analysis.level}
            </span>
          </div>

          {/* Confidence */}
          <div className="mb-4">
            <span className="font-semibold">Confidence: </span>
            <span>{(analysis.confidence * 100).toFixed(0)}%</span>
          </div>

          {/* Risk Reasons */}
          {analysis.reasons && analysis.reasons.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Risk Factors:</h4>
              <ul className="list-disc list-inside space-y-1">
                {analysis.reasons.map((reason, index) => (
                  <li key={index} className="text-sm">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Recommendations:</h4>
              <ul className="list-disc list-inside space-y-1">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Heuristics */}
          {analysis.heuristics && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-2">Detailed Metrics:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {analysis.heuristics.addressReputation !== undefined && (
                  <div>
                    <span className="font-medium">Address Rep:</span>{' '}
                    {(analysis.heuristics.addressReputation * 100).toFixed(0)}%
                  </div>
                )}
                {analysis.heuristics.transactionPattern !== undefined && (
                  <div>
                    <span className="font-medium">Pattern:</span>{' '}
                    {(analysis.heuristics.transactionPattern * 100).toFixed(0)}%
                  </div>
                )}
                {analysis.heuristics.amountRisk !== undefined && (
                  <div>
                    <span className="font-medium">Amount Risk:</span>{' '}
                    {(analysis.heuristics.amountRisk * 100).toFixed(0)}%
                  </div>
                )}
                {analysis.heuristics.velocityRisk !== undefined && (
                  <div>
                    <span className="font-medium">Velocity:</span>{' '}
                    {(analysis.heuristics.velocityRisk * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
