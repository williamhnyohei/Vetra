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
    <div className="bg-dark-card rounded-lg p-4 border border-yellow-500/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <img
            src="/assets/icon-warning.svg"
            alt="Warning"
            className="w-6 h-6"
          />
        </div>
        <div className="flex-1">
          <h3 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#E6E6E6',
              marginBottom: '4px'
            }}
          >
            {getTitle()}
          </h3>
          <p 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#858C94',
              marginBottom: '16px'
            }}
          >
            {amount} {token}
          </p>
        </div>
      </div>
      
      <div className="flex gap-3" style={{ marginLeft: '0' }}>
        <button 
          className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#FBB500',
            color: '#1A141F',
            fontFamily: 'Arial',
            fontWeight: '700',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            height: '3rem',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
          onClick={onViewAnalysis}
        >
          <img
            src="/assets/icon-analysis.svg"
            alt="Analysis"
            className="w-5 h-5"
          />
          View analysis
        </button>
        <button 
          className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#DA291C',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            height: '3rem',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
          onClick={onBlock}
        >
          <img
            src="/assets/icon-blocked.svg"
            alt="Block"
            className="w-5 h-5"
          />
          Block
        </button>
      </div>
    </div>
  );
};

export default TransactionAlert;

