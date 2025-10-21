import { useState } from 'react';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  to: string;
  riskScore: number;
  timestamp: number;
}

interface TransactionCardProps {
  transaction: Transaction;
  showFeedback?: boolean;
}

function TransactionCard({ transaction, showFeedback = false }: TransactionCardProps) {
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const getRiskColor = () => {
    if (transaction.riskScore >= 70) return 'bg-risk-low/10 text-risk-low border-risk-low';
    if (transaction.riskScore >= 40) return 'bg-risk-medium/10 text-risk-medium border-risk-medium';
    return 'bg-risk-high/10 text-risk-high border-risk-high';
  };

  const getRiskEmoji = () => {
    if (transaction.riskScore >= 70) return '🟢';
    if (transaction.riskScore >= 40) return '🟡';
    return '🔴';
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    // TODO: Send feedback to background script
    console.log('Feedback:', type, 'for transaction:', transaction.id);
  };

  return (
    <div className="space-y-3">
      {/* Card da transação */}
      <div className="hover:bg-dark-bg/50 transition-colors p-3 rounded-lg cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{transaction.type}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor()}`}>
            {getRiskEmoji()} {transaction.riskScore}
          </span>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Valor:</span>
            <span className="text-dark-text font-mono">{transaction.amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Para:</span>
            <span className="text-dark-text font-mono">{transaction.to}</span>
          </div>
          <div className="flex justify-between">
            <span>Horário:</span>
            <span className="text-dark-text">
              {new Date(transaction.timestamp).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Feedback do usuário */}
      {showFeedback && (
        <div className="bg-dark-bg/50 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">Este alerta foi útil?</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleFeedback('up')}
              className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                feedback === 'up'
                  ? 'bg-risk-low/20 border-risk-low text-risk-low'
                  : 'border-dark-border text-gray-400 hover:border-risk-low hover:text-risk-low'
              }`}
            >
              👍 Sim
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                feedback === 'down'
                  ? 'bg-risk-high/20 border-risk-high text-risk-high'
                  : 'border-dark-border text-gray-400 hover:border-risk-high hover:text-risk-high'
              }`}
            >
              👎 Não
            </button>
          </div>
          {feedback && (
            <p className="text-xs text-center text-primary mt-2">
              ✓ Obrigado pelo feedback!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TransactionCard;
