/**
 * Create transactions table
 * Stores analyzed transaction data
 */

exports.up = function(knex) {
  return knex.schema.createTable('transactions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('signature').unique();
    table.string('transaction_hash').index();
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
    
    // Indexes
    table.index(['user_id']);
    table.index(['signature']);
    table.index(['transaction_hash']);
    table.index(['risk_score']);
    table.index(['risk_level']);
    table.index(['status']);
    table.index(['analyzed_at']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};
