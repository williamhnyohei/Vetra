import React, { useState, useEffect } from 'react';

interface PendingTransaction {
  id: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  recommendations: string[];
  parsedTx: any;
  timestamp: number;
  heuristics?: {
    addressReputation?: number;
    patternDetection?: number;
    amountRisk?: number;
    mlScore?: number;
  };
  evidence?: Array<{
    source: string;
    url: string;
    confidence: number;
    description: string;
  }>;
}

const TransactionApproval: React.FC = () => {
  const [transaction, setTransaction] = useState<PendingTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load pending transaction from storage
    chrome.storage.local.get(['pendingTransaction'], (result) => {
      if (result.pendingTransaction) {
        setTransaction(result.pendingTransaction);
      }
      setLoading(false);
    });
  }, []);

  const handleApprove = () => {
    console.log('✅ User approved transaction');
    // Send decision to background script
    chrome.runtime.sendMessage({
      type: 'TRANSACTION_DECISION',
      approved: true,
    });
    
    // Clear pending transaction
    chrome.storage.local.remove(['pendingTransaction']);
    
    // Close popup
    window.close();
  };

  const handleReject = () => {
    console.log('🚫 User rejected transaction');
    // Send decision to background script
    chrome.runtime.sendMessage({
      type: 'TRANSACTION_DECISION',
      approved: false,
    });
    
    // Clear pending transaction
    chrome.storage.local.remove(['pendingTransaction']);
    
    // Close popup
    window.close();
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-dark-bg text-dark-text flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="w-full h-full bg-dark-bg text-dark-text flex items-center justify-center">
        <p className="text-gray-400">No pending transaction</p>
      </div>
    );
  }

  const getRiskColor = () => {
    switch (transaction.riskLevel) {
      case 'high':
        return '#FF4444';
      case 'medium':
        return '#FBB500';
      case 'low':
        return '#00D386';
      default:
        return '#858C94';
    }
  };

  return (
    <div className="w-full h-full bg-dark-bg text-dark-text overflow-y-auto">
      {/* Header with back button */}
      <div className="bg-dark-card border-b border-gray-700 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleReject}
          className="p-1 text-gray-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">Transaction Analysis</h1>
      </div>

      <div className="p-6">
        {/* Risk Score Circle (Main focal point) */}
        <div className="text-center mb-6">
          <div className="relative w-32 h-32 mx-auto mb-4">
            {/* Background circle */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke="#2D2D2D"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="60"
                stroke={getRiskColor()}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(transaction.riskScore / 100) * 377} 377`}
                strokeLinecap="round"
              />
            </svg>
            {/* Score number */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: getRiskColor() }}>
                {transaction.riskScore}
              </span>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-2" style={{ color: getRiskColor() }}>
            {transaction.riskLevel === 'high' ? 'High risk detected' : 
             transaction.riskLevel === 'medium' ? 'Medium risk detected' : 
             'Low risk detected'}
          </h2>
          <p className="text-gray-400 text-sm">
            Multiple pieces of evidence suggest suspicious activity
          </p>
        </div>

        {/* Score Combination */}
        {transaction.heuristics && (
          <div className="bg-dark-card rounded-lg p-4 mb-4 border border-gray-700">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">
              Score combinations from on-chain signals and external evidence
            </h3>
            <div className="space-y-2">
              {transaction.heuristics.addressReputation !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Address Reputation</span>
                  <span className="text-white font-mono">{transaction.heuristics.addressReputation}</span>
                </div>
              )}
              {transaction.heuristics.patternDetection !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Pattern Detection</span>
                  <span className="text-white font-mono">{transaction.heuristics.patternDetection}</span>
                </div>
              )}
              {transaction.heuristics.amountRisk !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount Risk</span>
                  <span className="text-white font-mono">{transaction.heuristics.amountRisk}</span>
                </div>
              )}
              {transaction.heuristics.mlScore !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">ML Prediction</span>
                  <span className="text-white font-mono">{transaction.heuristics.mlScore}</span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Risk Reasons */}
      {transaction.reasons && transaction.reasons.length > 0 && (
        <div className="bg-dark-card rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">⚠️ Risk Factors</h3>
          <ul className="space-y-2">
            {transaction.reasons.map((reason, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {transaction.recommendations && transaction.recommendations.length > 0 && (
        <div className="bg-dark-card rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">💡 Recommendations</h3>
          <ul className="space-y-2">
            {transaction.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-yellow-400 mt-1">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

        {/* Transaction Details */}
        <div className="bg-dark-card rounded-lg p-4 mb-4 border border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Destination Address</p>
              <p className="text-white font-mono text-xs break-all">
                {transaction.parsedTx?.toAddress?.slice(0, 12)}...{transaction.parsedTx?.toAddress?.slice(-8)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Value</p>
              <p className="text-white font-semibold">
                {transaction.parsedTx?.amount || '0'} {transaction.parsedTx?.tokenSymbol || 'SOL'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Network</p>
              <p className="text-white">Solana</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Time</p>
              <p className="text-white text-xs">
                {new Date(transaction.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Collected Evidence */}
        {transaction.evidence && transaction.evidence.length > 0 ? (
          <div className="bg-dark-card rounded-lg p-4 mb-6 border border-gray-700">
            <h3 className="font-semibold mb-3 text-sm">Collected Evidence</h3>
            <div className="space-y-3">
              {transaction.evidence.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        {item.source}
                      </a>
                      <span className="text-xs text-green-400">{item.confidence}%</span>
                    </div>
                    <p className="text-gray-400 text-xs">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          transaction.reasons && transaction.reasons.length > 0 && (
            <div className="bg-dark-card rounded-lg p-4 mb-6 border border-gray-700">
              <h3 className="font-semibold mb-3 text-sm">Risk Factors</h3>
              <ul className="space-y-2">
                {transaction.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={handleReject}
            className="py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#FF4444',
              color: '#FFFFFF',
              fontSize: '14px',
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
            Block
          </button>
          <button
            onClick={handleApprove}
            className="py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#00D386',
              color: '#1A141F',
              fontSize: '14px',
            }}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Allow
          </button>
        </div>

        {/* Warning Footer */}
        {transaction.riskLevel === 'high' && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400 text-center">
              ⚠️ This transaction has been flagged as high risk. Only approve if you completely trust the source.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionApproval;

