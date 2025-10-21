interface RiskScoreProps {
  score: number;
  reasons?: string[];
}

function RiskScore({ score, reasons = [] }: RiskScoreProps) {
  const getRiskColor = () => {
    if (score >= 70) return 'text-risk-low';
    if (score >= 40) return 'text-risk-medium';
    return 'text-risk-high';
  };

  const getRiskLabel = () => {
    if (score >= 70) return 'Risco Baixo';
    if (score >= 40) return 'Risco Médio';
    return 'Risco Alto';
  };

  const getRiskEmoji = () => {
    if (score >= 70) return '🟢';
    if (score >= 40) return '🟡';
    return '🔴';
  };

  const getRiskBgColor = () => {
    if (score >= 70) return 'bg-risk-low/10';
    if (score >= 40) return 'bg-risk-medium/10';
    return 'bg-risk-high/10';
  };

  return (
    <div className={`${getRiskBgColor()} rounded-lg p-6`}>
      {/* Semáforo + Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{getRiskEmoji()}</span>
          <div>
            <div className={`text-3xl font-bold ${getRiskColor()}`}>{score}</div>
            <div className={`text-sm font-semibold ${getRiskColor()}`}>
              {getRiskLabel()}
            </div>
          </div>
        </div>

        {/* Score visual circular */}
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 120 120" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#E6E6E6"
              strokeWidth="10"
              opacity="0.2"
            />
            {/* Progress circle */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              className={getRiskColor()}
              strokeDasharray={`${(score / 100) * 314} 314`}
            />
          </svg>
        </div>
      </div>

      {/* Motivos em linguagem simples */}
      {reasons.length > 0 && (
        <div className="border-t border-dark-border pt-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">
            Por que este score?
          </p>
          <ul className="space-y-1">
            {reasons.map((reason, idx) => (
              <li key={idx} className="text-sm text-dark-text flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RiskScore;
