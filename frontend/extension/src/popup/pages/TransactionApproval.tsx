import React, { useState, useEffect } from 'react';

interface PendingTransaction {
  id: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  recommendations: string[];
  parsedTx: any;
  timestamp: number;
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
    <div className="w-full h-full bg-dark-bg text-dark-text p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${getRiskColor()}20` }}>
          <svg className="w-8 h-8" fill={getRiskColor()} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Transaction Review</h1>
        <p className="text-gray-400">High risk transaction detected</p>
      </div>

      {/* Risk Score */}
      <div className="bg-dark-card rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Risk Score</span>
          <span className="text-2xl font-bold" style={{ color: getRiskColor() }}>
            {transaction.riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${transaction.riskScore}%`,
              backgroundColor: getRiskColor(),
            }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2 uppercase">
          {transaction.riskLevel} Risk
        </p>
      </div>

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
      <div className="bg-dark-card rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">📦 Transaction Details</h3>
        <div className="space-y-2 text-sm">
          {transaction.parsedTx?.fromAddress && (
            <div className="flex justify-between">
              <span className="text-gray-400">From:</span>
              <span className="text-gray-300 font-mono text-xs">
                {transaction.parsedTx.fromAddress.slice(0, 8)}...{transaction.parsedTx.fromAddress.slice(-6)}
              </span>
            </div>
          )}
          {transaction.parsedTx?.toAddress && (
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span>
              <span className="text-gray-300 font-mono text-xs">
                {transaction.parsedTx.toAddress.slice(0, 8)}...{transaction.parsedTx.toAddress.slice(-6)}
              </span>
            </div>
          )}
          {transaction.parsedTx?.amount && (
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-gray-300">
                {transaction.parsedTx.amount} {transaction.parsedTx.tokenSymbol || 'SOL'}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-400">Time:</span>
            <span className="text-gray-300">
              {new Date(transaction.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleReject}
          className="py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
          style={{
            backgroundColor: '#FF4444',
            color: '#FFFFFF',
          }}
        >
          🚫 Reject
        </button>
        <button
          onClick={handleApprove}
          className="py-3 px-4 rounded-lg font-semibold transition-all hover:opacity-80"
          style={{
            backgroundColor: '#00D386',
            color: '#1A141F',
          }}
        >
          ✅ Approve
        </button>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-xs text-yellow-500 text-center">
          ⚠️ This transaction has been flagged as high risk. Only approve if you trust the source.
        </p>
      </div>
    </div>
  );
};

export default TransactionApproval;

