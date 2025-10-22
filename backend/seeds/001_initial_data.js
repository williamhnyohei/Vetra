/**
 * Initial data seeds
 * Populate database with initial data
 */

exports.seed = async function(knex) {
  // Clear existing data
  await knex('attestations').del();
  await knex('transactions').del();
  await knex('providers').del();
  await knex('users').del();

  // Insert initial users
  await knex('users').insert([
    {
      id: 'user-1',
      email: 'admin@vetra.com',
      name: 'Admin User',
      provider: 'google',
      provider_id: 'google-123',
      is_active: true,
      is_verified: true,
      subscription_plan: 'pro',
    },
    {
      id: 'user-2',
      email: 'user@vetra.com',
      name: 'Regular User',
      provider: 'google',
      provider_id: 'google-456',
      is_active: true,
      is_verified: true,
      subscription_plan: 'free',
    },
  ]);

  // Insert initial providers
  await knex('providers').insert([
    {
      id: 'provider-1',
      pubkey: 'provider-pubkey-1',
      name: 'Vetra Provider',
      description: 'Official Vetra risk analysis provider',
      reputation: 850,
      total_stake: 100.0,
      attestation_count: 150,
      successful_attestations: 142,
      accuracy_rate: 94.67,
      is_active: true,
      is_verified: true,
    },
  ]);

  // Insert sample transactions
  await knex('transactions').insert([
    {
      id: 'tx-1',
      user_id: 'user-1',
      signature: 'signature-1',
      type: 'transfer',
      from_address: 'from-address-1',
      to_address: 'to-address-1',
      amount: '100.0',
      token_address: 'token-address-1',
      risk_score: 85,
      risk_level: 'high',
      risk_reasons: ['High amount', 'New token', 'Low liquidity'],
      status: 'pending',
    },
  ]);

  // Insert sample attestations
  await knex('attestations').insert([
    {
      id: 'attestation-1',
      provider_pubkey: 'provider-pubkey-1',
      transaction_hash: 'signature-1',
      risk_score: 85,
      risk_level: 'high',
      stake_amount: 5.0,
      reputation: 850,
      verified: true,
    },
  ]);
};
