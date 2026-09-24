export interface Settings {
  riskThreshold: number;
  autoBlockHighRisk: boolean;
  showAttestations: boolean;
  rpcEndpoint: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
  notifications: boolean;
  /** OpenAI API key (stored only in extension local storage). */
  openaiApiKey: string;
  /** Use OpenAI to rewrite/expand risk reasons when key is set. */
  openaiEnrichment: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  riskThreshold: 50,
  autoBlockHighRisk: false,
  showAttestations: true,
  rpcEndpoint: 'https://api.mainnet-beta.solana.com',
  network: 'mainnet-beta',
  notifications: true,
  openaiApiKey: '',
  openaiEnrichment: true,
};

