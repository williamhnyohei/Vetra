/**
 * Populate default preferences and settings for existing users
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

exports.up = async function(knex) {
  // Update users with empty preferences
  await knex('users')
    .where('preferences', '=', '{}')
    .orWhereNull('preferences')
    .update({
      preferences: JSON.stringify(DEFAULT_PREFERENCES),
      updated_at: knex.fn.now(),
    });

  // Update users with empty settings
  await knex('users')
    .where('settings', '=', '{}')
    .orWhereNull('settings')
    .update({
      settings: JSON.stringify(DEFAULT_SETTINGS),
      updated_at: knex.fn.now(),
    });
};

exports.down = async function(knex) {
  // Revert to empty objects
  await knex('users')
    .update({
      preferences: '{}',
      settings: '{}',
      updated_at: knex.fn.now(),
    });
};

