import React from 'react';

interface TransactionAnalysisProps {
  onBack?: () => void;
  transactionId?: string;
}

const TransactionAnalysis: React.FC<TransactionAnalysisProps> = ({ onBack, transactionId }) => {
  // Determine transaction status based on ID
  const getTransactionStatus = (id?: string) => {
    if (!id) return 'pending'; // Default for general analysis
    
    if (id.includes('blocked')) return 'blocked';
    if (id.includes('approved')) return 'approved';
    if (id.includes('warning')) return 'pending';
    
    return 'pending';
  };

  const transactionStatus = getTransactionStatus(transactionId);
  return (
    <div className="w-full h-full bg-dark-bg text-dark-text p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 text-gray-400 hover:text-white"
            onClick={onBack}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 
            style={{
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '18px',
              lineHeight: '24px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            Transaction Analysis
          </h1>
        </div>
        <button className="p-2 text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      {/* Risk Score Section */}
      <div className="text-center">
        <h2 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '16px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6',
            marginBottom: '16px'
          }}
        >
          Risk Score
        </h2>
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#1E1E1E"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#FF4444"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${85 * 2.51} 251`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span 
              style={{
                fontFamily: 'Arial',
                fontWeight: '700',
                fontSize: '32px',
                lineHeight: '40px',
                letterSpacing: '0px',
                color: '#FF4444'
              }}
            >
              85
            </span>
          </div>
        </div>
        <p 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6',
            marginBottom: '8px'
          }}
        >
          High risk detected: multiple pieces of evidence suggest suspicious activity.
        </p>
        <p 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0px',
            color: '#858C94'
          }}
        >
          Score combining on-chain signals and external evidence. 0 = low, 100 = very high.
        </p>
      </div>

      {/* Transaction Details */}
      <div className="bg-dark-card rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0px',
                color: '#858C94',
                marginBottom: '4px'
              }}
            >
              Destination Address
            </p>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              0xAb3...F9c2
            </p>
          </div>
          <div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0px',
                color: '#858C94',
                marginBottom: '4px'
              }}
            >
              Value
            </p>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              2.5 ETH
            </p>
          </div>
          <div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0px',
                color: '#858C94',
                marginBottom: '4px'
              }}
            >
              Network
            </p>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              Ethereum
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {transactionStatus === 'blocked' && (
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
          >
            <img
              src="/assets/icon-blocked.svg"
              alt="Blocked"
              className="w-5 h-5"
            />
            Blocked
          </button>
        )}
        
        {transactionStatus === 'approved' && (
          <button 
            className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
            style={{
              backgroundColor: '#00D386',
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
          >
            <img
              src="/assets/icon-success.svg"
              alt="Allowed"
              className="w-5 h-5"
            />
            Allowed
          </button>
        )}
        
        {transactionStatus === 'pending' && (
          <>
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
            >
              <img
                src="/assets/icon-blocked.svg"
                alt="Block"
                className="w-5 h-5"
              />
              Block
            </button>
            <button 
              className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
              style={{
                backgroundColor: '#00D386',
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
            >
              <img
                src="/assets/icon-success.svg"
                alt="Allow"
                className="w-5 h-5"
              />
              Allow
            </button>
          </>
        )}
      </div>

      {/* Collected Evidence */}
      <div>
        <h3 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '16px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6',
            marginBottom: '16px'
          }}
        >
          Collected Evidence
        </h3>
        
        <div className="space-y-3">
          {/* Evidence Card 1 */}
          <div className="bg-dark-card rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  etherscan.io
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#00D386'
                  }}
                >
                  92%
                </span>
              </div>
            </div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              This address has been reported in multiple suspicious transactions in the last 30 days.
            </p>
          </div>

          {/* Evidence Card 2 */}
          <div className="bg-dark-card rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  twitter.com
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#00D386'
                  }}
                >
                  73%
                </span>
              </div>
            </div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              ALERT: New scam identified using this address. Avoid transactions!
            </p>
          </div>
        </div>

        {/* View More Button */}
        <button className="w-full mt-4 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors py-2">
          <span 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0px'
            }}
          >
            View more
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TransactionAnalysis;
