/**
 * Solana Connection - Cliente RPC para blockchain
 */

import { Connection, ConnectionConfig } from '@solana/web3.js';

/**
 * Configuração padrão do RPC
 */
const DEFAULT_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
};

/**
 * Cria conexão com a blockchain Solana
 */
export function createConnection(endpoint?: string): Connection {
  const rpcUrl = endpoint || import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  return new Connection(rpcUrl, DEFAULT_CONFIG);
}

/**
 * Singleton connection instance
 */
let connectionInstance: Connection | null = null;

/**
 * Obtém instância singleton da conexão
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = createConnection();
  }
  return connectionInstance;
}

