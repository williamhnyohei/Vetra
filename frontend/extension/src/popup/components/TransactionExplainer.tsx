interface TransactionExplainerProps {
  explanation: string;
}

function TransactionExplainer({ explanation }: TransactionExplainerProps) {
  return (
    <div className="bg-primary/10 border-l-4 border-primary rounded-lg p-4">
      <p className="text-sm text-dark-text leading-relaxed">
        {explanation}
      </p>
      
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>💬</span>
        <span>Explicação em linguagem simples</span>
      </div>
    </div>
  );
}

export default TransactionExplainer;


