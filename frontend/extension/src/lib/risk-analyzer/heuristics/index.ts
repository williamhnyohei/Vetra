/**
 * Heuristics - Regras de análise de risco baseadas no Business Plan
 * 
 * Implementa as 5 heurísticas principais mencionadas:
 * 1. Idade do contrato
 * 2. Permissões perigosas (gasto ilimitado)
 * 3. Liquidez (baixa ou não travada)
 * 4. Concentração de holders
 * 5. Blacklist/padrões de scams
 */

export * from './token-check';
export * from './program-check';
export * from './account-reputation';
export * from './amount-analysis';

// Novas heurísticas baseadas no BP
export * from './contract-age';
export * from './dangerous-permissions';
export * from './liquidity-check';
export * from './holder-concentration';
export * from './scam-patterns';
