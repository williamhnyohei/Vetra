/**
 * Default values for user settings
 * All user configurations are now consolidated in a single settings object
 */

const DEFAULT_SETTINGS = {
  // UI Preferences
  language: 'en',
  theme: 'dark',
  soundAlerts: true,
  
  // Notifications
  notifications: {
    email: true,
    push: true,
    risk_alerts: true,
    attestation_updates: true,
  },
  
  // AI Configuration
  ai_language: 'en',
  aiLanguage: 'en',
  ai_rigidity: 50,
  aiRigidity: 50,
  
  // Privacy
  share_insights: false,
  shareInsights: false,
  
  // Security Settings
  risk_threshold: 50,
  auto_block_high_risk: false,
  show_attestations: true,
  
  // Network Configuration
  network: 'mainnet-beta',
  rpc_endpoint: 'https://api.mainnet-beta.solana.com',
  
  // Features
  transaction_memory: true,
  transactionMemory: true,
  smart_contract_fingerprints: true,
  smartContractFingerprints: true,
};

module.exports = {
  DEFAULT_SETTINGS,
};

