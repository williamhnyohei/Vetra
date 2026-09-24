// src/popup/App.tsx
import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome';
import TransactionAnalysis from './pages/TransactionAnalysis';
import ConnectWallet from './pages/ConnectWallet';
import Plans from './pages/Plans';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';

type Page =
  | 'welcome'
  | 'home'
  | 'history'
  | 'settings'
  | 'transaction-analysis'
  | 'connect-wallet'
  | 'plans';

function App() {
  const {
    isAuthenticated,
    isLoading,
    checkAuthStatus,
    loginAsGuest,
    loginWithGoogle,
  } = useAuthStore();
  const { theme, applyTheme } = useThemeStore();

  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');

  // aplica tema
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // checa auth ao abrir popup
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Ao abrir o popup, injeta Vetra na aba ativa (precisa do clique do ícone = activeTab)
  useEffect(() => {
    try {
      chrome.runtime?.sendMessage?.({ type: 'INJECT_ACTIVE_TAB' }, (res) => {
        if (chrome.runtime.lastError) {
          console.warn('INJECT_ACTIVE_TAB:', chrome.runtime.lastError.message);
          return;
        }
        console.log('INJECT_ACTIVE_TAB result:', res);
      });
    } catch (e) {
      console.warn('INJECT_ACTIVE_TAB failed', e);
    }
  }, []);

  // quando o auth carregar, decide tela inicial
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setCurrentPage('welcome');
      return;
    }

    const goToAnalysisIfLive = (analysis: any) => {
      if (
        analysis &&
        Date.now() - (analysis.ts || 0) < 120_000 &&
        (analysis.status === 'analyzing' || analysis.status === 'pending_decision')
      ) {
        setSelectedTransactionId(''); // live intercept — not a history review
        setCurrentPage('transaction-analysis');
        return true;
      }
      return false;
    };

    chrome.runtime
      ?.sendMessage?.({ type: 'GET_LATEST_ANALYSIS' })
      .then((res) => {
        if (!goToAnalysisIfLive(res?.analysis)) {
          setCurrentPage('home');
        }
      })
      .catch(() => setCurrentPage('home'));

    const onStorage = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string
    ) => {
      if (area === 'session' && changes.vetraLatestAnalysis?.newValue) {
        goToAnalysisIfLive(changes.vetraLatestAnalysis.newValue);
      }
    };
    try {
      chrome.storage.onChanged.addListener(onStorage);
    } catch {
      /* ignore */
    }
    return () => {
      try {
        chrome.storage.onChanged.removeListener(onStorage);
      } catch {
        /* ignore */
      }
    };
  }, [isAuthenticated, isLoading]);

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return (
          <Welcome
            onGoogleLogin={async () => {
              await loginWithGoogle();
              // se der certo, o efeito lá em cima já troca pra home
            }}
            onContinueAsGuest={async () => {
              await loginAsGuest();
            }}
          />
        );

      case 'home':
        return (
          <Home
            onNavigateToAnalysis={() => setCurrentPage('transaction-analysis')}
            onNavigateToConnectWallet={() => setCurrentPage('connect-wallet')}
            onNavigateToPlans={() => setCurrentPage('plans')}
            onNavigateToSettings={() => setCurrentPage('settings')}
            onNavigateToHistory={() => setCurrentPage('history')}
            onNavigateToTransaction={(transactionId) => {
              setSelectedTransactionId(transactionId);
              setCurrentPage('transaction-analysis');
            }}
          />
        );

      case 'history':
        return (
          <History
            onBack={() => setCurrentPage('home')}
            onNavigateToPlans={() => setCurrentPage('plans')}
          />
        );

      case 'settings':
        return <Settings onBack={() => setCurrentPage('home')} />;

      case 'transaction-analysis':
        return (
          <TransactionAnalysis
            onBack={() => {
              setSelectedTransactionId('');
              setCurrentPage('home');
            }}
            transactionId={selectedTransactionId}
          />
        );

      case 'connect-wallet':
        return <ConnectWallet onBack={() => setCurrentPage('home')} />;

      case 'plans':
        return <Plans onBack={() => setCurrentPage('home')} />;

      default:
        // fallback seguro
        return (
          <Home
            onNavigateToAnalysis={() => setCurrentPage('transaction-analysis')}
            onNavigateToConnectWallet={() => setCurrentPage('connect-wallet')}
            onNavigateToPlans={() => setCurrentPage('plans')}
            onNavigateToSettings={() => setCurrentPage('settings')}
            onNavigateToHistory={() => setCurrentPage('history')}
            onNavigateToTransaction={(transactionId) => {
              setSelectedTransactionId(transactionId);
              setCurrentPage('transaction-analysis');
            }}
          />
        );
    }
  };

  // loading do auth
  if (isLoading) {
    return (
      <div
        className="w-popup h-popup bg-dark-bg text-dark-text flex items-center justify-center"
        style={{ borderRadius: '14px' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-popup h-popup bg-dark-bg text-dark-text"
      style={{ borderRadius: '14px' }}
    >
      {renderPage()}
    </div>
  );
}

export default App;