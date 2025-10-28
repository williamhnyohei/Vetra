import React, { useState, useEffect } from 'react';
import ApiService from '../../services/api-service';

interface HistoryProps {
  onBack?: () => void;
  onNavigateToPlans?: () => void;
}

const History: React.FC<HistoryProps> = ({ onBack, onNavigateToPlans }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isFreePlan] = useState(true); // Simulate Free plan
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Busca transações reais do backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const apiService = ApiService.getInstance();
        const response = await apiService.getTransactionHistory({ 
          page: currentPage, 
          limit: 10 
        });
        setAllTransactions(response.transactions || []);
        setTotalPages(response.pagination?.pages || 1);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setAllTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage]);

  // Filtra transações baseado no plano (Free = apenas 3)
  const transactions = isFreePlan ? allTransactions.slice(0, 3) : allTransactions;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'blocked':
        return (
          <img
            src="/assets/icon-forbidden.svg"
            alt="Blocked"
            className="w-4 h-4"
          />
        );
      case 'approved':
        return (
          <img
            src="/assets/icon-success.svg"
            alt="Approved"
            className="w-4 h-4"
          />
        );
      case 'warning':
        return (
          <img
            src="/assets/icon-droplet.svg"
            alt="Warning"
            className="w-4 h-4"
          />
        );
      default:
        return null;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return '#FF4444'; // Red
    if (risk >= 40) return '#FF8800'; // Orange
    return '#00D386'; // Green
  };

  const getRiskBackgroundColor = (risk: number) => {
    if (risk >= 70) return '#FF4444';
    if (risk >= 40) return '#FF8800';
    return '#00D386';
  };

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

      {/* Table */}
      <div className="bg-dark-card rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-dark-border">
          <div 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            ADDRESS
          </div>
          <div 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            AMOUNT
          </div>
          <div 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            NETWORK
          </div>
          <div 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            RISK
          </div>
          <div 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            DATE
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-dark-border">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="grid grid-cols-5 gap-4 p-4 hover:bg-dark-bg/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                {getStatusIcon(transaction.status)}
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
                  {transaction.to_address ? `${transaction.to_address.substring(0, 5)}...${transaction.to_address.substring(transaction.to_address.length - 4)}` : 'Desconhecido'}
                </span>
              </div>
              <div 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                {transaction.amount ? `${(parseFloat(transaction.amount) / 1e9).toFixed(4)} SOL` : 'N/A'}
              </div>
              <div 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                {transaction.type || 'Solana'}
              </div>
              <div className="flex items-center justify-between">
                <span 
                  className="px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: getRiskBackgroundColor(transaction.risk_score || 0),
                    color: '#FFFFFF',
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px'
                  }}
                >
                  {transaction.risk_score || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
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
                  {transaction.analyzed_at ? new Date(transaction.analyzed_at).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination - Only show for Pro plan */}
      {!isFreePlan && (
        <div className="flex items-center justify-center gap-2">
        <button 
          className="p-2 text-gray-400 hover:text-white"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          className={`px-3 py-1 rounded ${
            currentPage === 1 ? 'bg-gray-600' : 'bg-transparent'
          }`}
          onClick={() => setCurrentPage(1)}
        >
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
            1
          </span>
        </button>
        
        <button 
          className={`px-3 py-1 rounded ${
            currentPage === 2 ? 'bg-gray-600' : 'bg-transparent'
          }`}
          onClick={() => setCurrentPage(2)}
        >
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
            2
          </span>
        </button>
        
        <button 
          className={`px-3 py-1 rounded ${
            currentPage === 3 ? 'bg-gray-600' : 'bg-transparent'
          }`}
          onClick={() => setCurrentPage(3)}
        >
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
            3
          </span>
        </button>
        
        <span 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            color: '#858C94'
          }}
        >
          ...
        </span>
        
        <button 
          className="px-3 py-1 rounded bg-transparent"
          onClick={() => setCurrentPage(12)}
        >
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
            12
          </span>
        </button>
        
        <button 
          className="p-2 text-gray-400 hover:text-white"
          onClick={() => setCurrentPage(Math.min(12, currentPage + 1))}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        </div>
      )}

      {/* Free Plan Upgrade Section - Only show for Free plan */}
      {isFreePlan && (
        <div className="border border-yellow-500 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p 
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
              Limited history (last 3 transactions)
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
              Upgrade to Pro for full access to history
            </p>
          </div>
          <button 
            className="px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: '#FBB500',
              color: '#1A141F',
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '14px',
              lineHeight: '20px',
              letterSpacing: '0px'
            }}
            onClick={onNavigateToPlans}
          >
            View Plans
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default History;