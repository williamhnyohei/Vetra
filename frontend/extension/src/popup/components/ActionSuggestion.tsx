interface ActionSuggestionProps {
  riskScore: number;
}

function ActionSuggestion({ riskScore }: ActionSuggestionProps) {
  const getActions = () => {
    if (riskScore >= 70) {
      return {
        primary: '✅ Prosseguir com a transação',
        primaryClass: 'bg-risk-low hover:bg-risk-low/90',
        secondary: '🔍 Ver mais detalhes',
        message: 'Esta transação parece segura.',
      };
    }
    
    if (riskScore >= 40) {
      return {
        primary: '⚠️ Assinar com cuidado',
        primaryClass: 'bg-risk-medium hover:bg-risk-medium/90',
        secondary: '🧪 Simular com valor mínimo',
        message: 'Atenção: alguns riscos foram identificados.',
      };
    }
    
    return {
      primary: '🛑 Cancelar transação',
      primaryClass: 'bg-risk-high hover:bg-risk-high/90',
      secondary: '📞 Reportar suspeita',
      message: 'CUIDADO: Esta transação apresenta alto risco!',
    };
  };

  const actions = getActions();

  return (
    <div className="bg-dark-card rounded-lg p-4 space-y-3">
      <p className="text-sm font-medium">{actions.message}</p>
      
      <div className="space-y-2">
        <button
          className={`w-full ${actions.primaryClass} text-white font-semibold py-3 px-4 rounded-lg transition-colors`}
        >
          {actions.primary}
        </button>
        
        <button className="w-full bg-dark-bg text-dark-text border border-dark-border py-3 px-4 rounded-lg hover:bg-dark-border/20 transition-colors">
          {actions.secondary}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        💡 Sempre verifique o endereço e o valor antes de assinar
      </p>
    </div>
  );
}

export default ActionSuggestion;


