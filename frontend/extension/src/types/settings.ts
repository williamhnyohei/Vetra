export interface Settings {
  riskThreshold: number;
  autoBlockHighRisk: boolean;
  showAttestations: boolean;
  rpcEndpoint: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  notifications: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  riskThreshold: 50,
  autoBlockHighRisk: false,
  showAttestations: true,
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  network: 'mainnet-beta',
  notifications: true,
};

