/**
 * Default values for user preferences and settings
 */

const DEFAULT_PREFERENCES = {
  language: 'en',
  theme: 'dark',
  notifications: {
    email: true,
    push: true,
    risk_alerts: true,
    attestation_updates: true,
  },
  ai_language: 'en',
  share_insights: false,
};

const DEFAULT_SETTINGS = {
  risk_threshold: 50,
  auto_block_high_risk: false,
  show_attestations: true,
  network: 'mainnet-beta',
  rpc_endpoint: 'https://api.mainnet-beta.solana.com',
  ai_rigidity: 50,
  transaction_memory: true,
  smart_contract_fingerprints: true,
};

module.exports = {
  DEFAULT_PREFERENCES,
  DEFAULT_SETTINGS,
};

