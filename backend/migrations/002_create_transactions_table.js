/**
 * Create transactions table
 * Stores analyzed transaction data
 */

exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('signature').unique();
    table.string('transaction_hash');
    table.enum('type', ['transfer', 'swap', 'approve', 'mint', 'burn', 'other']).notNullable();
    table.string('from_address').notNullable();
    table.string('to_address').notNullable();
    table.decimal('amount', 20, 8).notNullable();
    table.string('token_address');
    table.string('token_symbol');
    table.integer('risk_score').notNullable(); // 0-100
    table.enum('risk_level', ['low', 'medium', 'high']).notNullable();
    table.jsonb('risk_reasons').defaultTo('[]');
    table.jsonb('heuristics').defaultTo('{}');
    table.enum('status', ['pending', 'approved', 'rejected', 'completed']).defaultTo('pending');
    table.boolean('user_approved');
    table.text('user_feedback');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('analyzed_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).then(() => {
    // Create indexes separately to avoid conflicts
    return knex.schema.raw(`
      CREATE INDEX IF NOT EXISTS transactions_user_id_index ON transactions (user_id);
      CREATE INDEX IF NOT EXISTS transactions_signature_index ON transactions (signature);
      CREATE INDEX IF NOT EXISTS transactions_transaction_hash_index ON transactions (transaction_hash);
      CREATE INDEX IF NOT EXISTS transactions_risk_score_index ON transactions (risk_score);
      CREATE INDEX IF NOT EXISTS transactions_risk_level_index ON transactions (risk_level);
      CREATE INDEX IF NOT EXISTS transactions_status_index ON transactions (status);
      CREATE INDEX IF NOT EXISTS transactions_analyzed_at_index ON transactions (analyzed_at);
      CREATE INDEX IF NOT EXISTS transactions_created_at_index ON transactions (created_at);
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};
