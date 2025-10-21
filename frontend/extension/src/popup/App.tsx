import { useState, useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import Welcome from './pages/Welcome'; // Import Welcome component
import TransactionAnalysis from './pages/TransactionAnalysis'; // Import TransactionAnalysis component
import ConnectWallet from './pages/ConnectWallet'; // Import ConnectWallet component
import Plans from './pages/Plans'; // Import Plans component
import { useAuthStore } from '../store/auth-store'; // Import auth store

type Page = 'welcome' | 'home' | 'history' | 'settings' | 'transaction-analysis' | 'connect-wallet' | 'plans';

function App() {
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Update current page when auth status changes
  useEffect(() => {
    if (!isLoading) {
      setCurrentPage(isAuthenticated ? 'home' : 'welcome');
    }
  }, [isAuthenticated, isLoading]);

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <Welcome 
          onGoogleLogin={async () => { 
            await useAuthStore.getState().loginWithGoogle(); 
          }} 
          onContinueAsGuest={() => { 
            useAuthStore.getState().loginAsGuest(); 
          }} 
        />;
      case 'home':
        return <Home 
          onNavigateToAnalysis={() => setCurrentPage('transaction-analysis')} 
          onNavigateToConnectWallet={() => setCurrentPage('connect-wallet')} 
          onNavigateToPlans={() => setCurrentPage('plans')} 
          onNavigateToSettings={() => setCurrentPage('settings')}
          onNavigateToHistory={() => setCurrentPage('history')}
          onNavigateToTransaction={(transactionId) => {
            setSelectedTransactionId(transactionId);
            setCurrentPage('transaction-analysis');
          }}
        />;
      case 'history':
        return <History 
          onBack={() => setCurrentPage('home')} 
          onNavigateToPlans={() => setCurrentPage('plans')} 
        />;
      case 'settings':
        return <Settings onBack={() => setCurrentPage('home')} />;
      case 'transaction-analysis':
        return <TransactionAnalysis 
          onBack={() => setCurrentPage('home')} 
          transactionId={selectedTransactionId}
        />;
      case 'connect-wallet':
        return <ConnectWallet onBack={() => setCurrentPage('home')} />;
      case 'plans':
        return <Plans onBack={() => setCurrentPage('home')} />;
      default:
        return <Home 
          onNavigateToAnalysis={() => setCurrentPage('transaction-analysis')} 
          onNavigateToConnectWallet={() => setCurrentPage('connect-wallet')} 
          onNavigateToPlans={() => setCurrentPage('plans')} 
          onNavigateToSettings={() => setCurrentPage('settings')}
          onNavigateToHistory={() => setCurrentPage('history')}
          onNavigateToTransaction={(transactionId) => {
            setSelectedTransactionId(transactionId);
            setCurrentPage('transaction-analysis');
          }}
        />;
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-popup h-popup bg-dark-bg text-dark-text flex items-center justify-center" style={{ borderRadius: '14px' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-popup h-popup bg-dark-bg text-dark-text" style={{ borderRadius: '14px' }}>
      {renderPage()}
    </div>
  );
}

export default App;