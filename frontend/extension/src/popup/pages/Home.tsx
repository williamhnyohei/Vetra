import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/language-store';
import { t } from '../../i18n';
import ApiService from '../../services/api-service';
import TransactionAlert from '../components/TransactionAlert';

interface HomeProps {
  onNavigateToAnalysis?: () => void;
  onNavigateToConnectWallet?: () => void;
  onNavigateToPlans?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToHistory?: () => void;
  onNavigateToTransaction?: (transactionId: string) => void;
  onNavigateToTransactionApproval?: () => void;
}

const Home: React.FC<HomeProps> = ({ onNavigateToConnectWallet, onNavigateToPlans, onNavigateToSettings, onNavigateToHistory, onNavigateToTransaction, onNavigateToTransactionApproval }) => {
  const { language } = useLanguageStore();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  // Verifica transações pendentes (interceptadas)
  useEffect(() => {
    const checkPendingTransaction = () => {
      chrome.storage.local.get(['pendingTransaction'], (result) => {
        if (result.pendingTransaction) {
          setPendingTransaction(result.pendingTransaction);
        } else {
          setPendingTransaction(null);
        }
      });
    };

    checkPendingTransaction();
    const interval = setInterval(checkPendingTransaction, 500);

    return () => clearInterval(interval);
  }, []);

  // Busca transações reais do backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const apiService = ApiService.getInstance();
        const response = await apiService.getTransactionHistory({ limit: 3 });
        console.log('📊 Transactions loaded:', response.transactions);
        setRecentTransactions(response.transactions || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        // Se der erro, deixa vazio
        setRecentTransactions([]);
      }
    };

    fetchTransactions();
    
    // Recarrega a cada 2 segundos para pegar novas transações
    const interval = setInterval(fetchTransactions, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handlers para o alerta de transação
  const handleViewAnalysis = () => {
    if (onNavigateToTransactionApproval) {
      onNavigateToTransactionApproval();
    }
  };

  const handleBlockTransaction = () => {
    // Send rejection to background
    chrome.runtime.sendMessage({
      type: 'TRANSACTION_DECISION',
      approved: false,
    });
    
    // Clear pending transaction
    chrome.storage.local.remove(['pendingTransaction']);
    setPendingTransaction(null);
  };
  
  return (
    <div className="w-full h-full bg-dark-bg text-dark-text p-4 space-y-4 overflow-y-auto relative">
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

      {/* Transaction Alert (shows when transaction is intercepted) */}
      {pendingTransaction && (
        <TransactionAlert
          riskLevel={pendingTransaction.riskLevel}
          amount={pendingTransaction.parsedTx?.amount || '0'}
          token={pendingTransaction.parsedTx?.tokenSymbol || 'SOL'}
          onViewAnalysis={handleViewAnalysis}
          onBlock={handleBlockTransaction}
        />
      )}

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
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p style={{ color: '#858C94', fontSize: '14px' }}>
                Nenhuma transação ainda
              </p>
              <p style={{ color: '#858C94', fontSize: '12px', marginTop: '8px' }}>
                As transações aparecem aqui quando interceptadas
              </p>
            </div>
          ) : (
            recentTransactions.map((tx) => {
              // Determina o ícone baseado no status/risco
              let icon = '/assets/icon-success.svg';
              if (tx.status === 'rejected' || tx.risk_level === 'high') {
                icon = '/assets/icon-forbidden.svg';
              } else if (tx.risk_level === 'medium') {
                icon = '/assets/icon-droplet.svg';
              }

              return (
                <div 
                  key={tx.id}
                  className="bg-dark-card rounded-lg p-4 flex items-center justify-between hover:bg-dark-card/80 transition-colors cursor-pointer"
                  onClick={() => onNavigateToTransaction?.(tx.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <img
                        src={icon}
                        alt="Status"
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
                        {tx.to_address ? `${tx.to_address.substring(0, 5)}...${tx.to_address.substring(tx.to_address.length - 4)}` : 'Desconhecido'}
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
                        {tx.amount ? `${(parseFloat(tx.amount) / 1e9).toFixed(4)} SOL` : tx.type}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })
          )}
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