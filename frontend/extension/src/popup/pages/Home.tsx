import React from 'react';
import { useLanguageStore } from '../../store/language-store';
import { t } from '../../i18n';

interface HomeProps {
  onNavigateToAnalysis?: () => void;
  onNavigateToConnectWallet?: () => void;
  onNavigateToPlans?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToTransaction?: (transactionId: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigateToAnalysis, onNavigateToConnectWallet, onNavigateToPlans, onNavigateToSettings, onNavigateToHistory, onNavigateToTransaction }) => {
  const { language } = useLanguageStore();
  
  return (
    <div className="w-full h-full bg-dark-bg text-dark-text p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo Vetra */}
          <div className="w-8 h-8">
            <img
              src="/assets/logo.svg"
              alt="Vetra Logo"
              className="w-8 h-8"
              style={{ maxWidth: '32px', maxHeight: '32px' }}
            />
          </div>
          <div className="flex flex-col">
            <span 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              {t('home.status', language)}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                {t('home.protected', language)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: '#1E1E1E',
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#00D386'
            }}
            onClick={onNavigateToConnectWallet}
          >
            {t('home.connectedWallet', language)}
          </button>
          <button 
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: '#1E1E1E',
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#FFFFFF'
            }}
            onClick={onNavigateToPlans}
          >
            {t('home.free', language)}
          </button>
          <button 
            className="p-2 rounded-full"
            style={{
              backgroundColor: '#1E1E1E',
              color: '#FFFFFF'
            }}
            onClick={onNavigateToSettings}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      {/* High-risk Transaction Alert */}
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
              {t('home.highRiskDetected', language)}
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
              2.5 ETH - Ethereum
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
                onClick={onNavigateToAnalysis}
              >
            <img
              src="/assets/icon-analysis.svg"
              alt="Analysis"
              className="w-5 h-5"
            />
            {t('home.viewAnalysis', language)}
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
          >
            <img
              src="/assets/icon-blocked.svg"
              alt="Block"
              className="w-5 h-5"
            />
            {t('home.block', language)}
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>
        <h2 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6',
            marginBottom: '0.75rem'
          }}
        >
          {t('home.recentActivity', language)}
        </h2>
        <div className="space-y-3">
          {/* Transaction 1 - Blocked */}
          <div 
            className="bg-dark-card rounded-lg p-4 flex items-center justify-between hover:bg-dark-card/80 transition-colors cursor-pointer"
            onClick={() => onNavigateToTransaction?.('tx-blocked-1')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/assets/icon-forbidden.svg"
                  alt="Forbidden"
                  className="w-4 h-4"
                />
              </div>
              <div>
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
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  2.5 ETH - Ethereum
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Transaction 2 - Approved */}
          <div 
            className="bg-dark-card rounded-lg p-4 flex items-center justify-between hover:bg-dark-card/80 transition-colors cursor-pointer"
            onClick={() => onNavigateToTransaction?.('tx-approved-1')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/assets/icon-success.svg"
                  alt="Success"
                  className="w-4 h-4"
                />
              </div>
              <div>
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
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  2.5 ETH - Ethereum
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Transaction 3 - Warning */}
          <div 
            className="bg-dark-card rounded-lg p-4 flex items-center justify-between hover:bg-dark-card/80 transition-colors cursor-pointer"
            onClick={() => onNavigateToTransaction?.('tx-warning-1')}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img
                  src="/assets/icon-droplet.svg"
                  alt="Warning"
                  className="w-4 h-4"
                />
              </div>
              <div>
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
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  2.5 ETH - Ethereum
                </p>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex gap-3" style={{ marginTop: '1rem' }}>
        <button 
          className="flex-1 bg-dark-card rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-dark-card/80 transition-colors"
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6'
          }}
          onClick={onNavigateToHistory}
        >
          <img
            src="/assets/icon-history.svg"
            alt="History"
            className="w-5 h-5"
          />
          <span>{t('home.history', language)}</span>
        </button>
        <button 
          className="flex-1 bg-dark-card rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-dark-card/80 transition-colors"
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#E6E6E6'
          }}
          onClick={onNavigateToPlans}
        >
          <img
            src="/assets/icon-payment-card.svg"
            alt="Plans"
            className="w-5 h-5"
          />
          <span>{t('home.plans', language)}</span>
        </button>
      </div>
    </div>
  );
};

export default Home;