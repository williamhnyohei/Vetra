import React from 'react';

interface TransactionAlertProps {
  riskLevel: 'low' | 'medium' | 'high';
  amount: string;
  token: string;
  onViewAnalysis: () => void;
  onBlock: () => void;
}

const TransactionAlert: React.FC<TransactionAlertProps> = ({
  riskLevel,
  amount,
  token,
  onViewAnalysis,
  onBlock,
}) => {
  const getRiskColor = () => {
    switch (riskLevel) {
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

  const getTitle = () => {
    switch (riskLevel) {
      case 'high':
        return 'High-risk transaction detected';
      case 'medium':
        return 'Medium-risk transaction detected';
      case 'low':
        return 'Low-risk transaction detected';
      default:
        return 'Transaction detected';
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 bg-dark-bg border rounded-lg shadow-lg p-4"
      style={{
        borderColor: getRiskColor(),
        borderWidth: '2px',
      }}>
      {/* Alert Icon and Title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${getRiskColor()}20` }}>
          <svg className="w-6 h-6" fill={getRiskColor()} viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white" style={{ fontSize: '14px' }}>
            {getTitle()}
          </h3>
          <p className="text-gray-400" style={{ fontSize: '12px' }}>
            {amount} {token}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onViewAnalysis}
          className="py-2.5 px-4 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#FBB500',
            color: '#1A141F',
            fontSize: '14px',
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          View analysis
        </button>
        <button
          onClick={onBlock}
          className="py-2.5 px-4 rounded-lg font-semibold transition-all hover:opacity-80 flex items-center justify-center gap-2"
          style={{
            backgroundColor: '#FF4444',
            color: '#FFFFFF',
            fontSize: '14px',
          }}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
          Block
        </button>
      </div>
    </div>
  );
};

export default TransactionAlert;

