import React from 'react';

interface ConnectWalletProps {
  onBack?: () => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ onBack }) => {
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
            Connect Wallet
          </h1>
        </div>
      </div>

      {/* Wallet Icon and Description */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-16 h-16 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 7h-3V6a3 3 0 0 0-3-3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1h3a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM5 4h10a1 1 0 0 1 1 1v1H5V5a1 1 0 0 1 1-1zm11 14H5a1 1 0 0 1-1-1V8h12v10a1 1 0 0 1-1 1z"/>
            <path d="M15 10a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-1-1z"/>
          </svg>
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
          Choose your wallet to start protecting your transactions.
        </p>
      </div>

      {/* Wallet Options */}
      <div className="space-y-3">
        {/* MetaMask */}
        <button className="w-full bg-orange-500 rounded-lg p-4 flex items-center justify-between hover:bg-orange-600 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '700',
                  fontSize: '16px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#F97316'
                }}
              >
                M
              </span>
            </div>
            <div className="text-left">
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#FFFFFF'
                }}
              >
                MetaMask
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#FFFFFF'
                }}
              >
                Connect via extension
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* WalletConnect */}
        <button className="w-full bg-blue-500 rounded-lg p-4 flex items-center justify-between hover:bg-blue-600 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '700',
                  fontSize: '16px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#3B82F6'
                }}
              >
                W
              </span>
            </div>
            <div className="text-left">
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#FFFFFF'
                }}
              >
                WalletConnect
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#FFFFFF'
                }}
              >
                Scan QR Code
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Other Wallets */}
        <button className="w-full bg-yellow-500 rounded-lg p-4 flex items-center justify-between hover:bg-yellow-600 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="flex flex-col gap-1">
                <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
            <div className="text-left">
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#FFFFFF'
                }}
              >
                Other wallets
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#FFFFFF'
                }}
              >
                See more options
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Security Message */}
      <div className="bg-dark-card rounded-lg p-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
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
          Your private keys remain secure. Vetra never solicits or stores your credentials.
        </p>
      </div>

      {/* Skip Button */}
      <button className="w-full bg-dark-card rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-dark-card/80 transition-colors">
        <span 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6'
          }}
        >
          Skip for now
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default ConnectWallet;
