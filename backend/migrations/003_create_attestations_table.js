/**
 * Create attestations table
 * Stores on-chain attestation data
 */

exports.up = function(knex) {
  return knex.schema.createTable('attestations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('provider_pubkey').notNullable();
    table.string('transaction_hash').notNullable();
    table.integer('risk_score').notNullable(); // 0-100
    table.enum('risk_level', ['low', 'medium', 'high']).notNullable();
    table.decimal('stake_amount', 20, 8).notNullable(); // SOL staked
    table.integer('reputation').defaultTo(0); // 0-1000
    table.boolean('verified').defaultTo(false);
    table.jsonb('evidence').defaultTo('{}');
    table.string('on_chain_signature');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['provider_pubkey']);
    table.index(['transaction_hash']);
    table.index(['risk_score']);
    table.index(['risk_level']);
    table.index(['reputation']);
    table.index(['verified']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('attestations');
};
