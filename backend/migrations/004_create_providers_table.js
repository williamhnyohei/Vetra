/**
 * Create providers table
 * Stores attestation provider information
 */

exports.up = function(knex) {
  return knex.schema.createTable('providers', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('pubkey').unique().notNullable();
    table.string('name');
    table.text('description');
    table.integer('reputation').defaultTo(0); // 0-1000
    table.decimal('total_stake', 20, 8).defaultTo(0);
    table.integer('attestation_count').defaultTo(0);
    table.integer('successful_attestations').defaultTo(0);
    table.decimal('accuracy_rate', 5, 2).defaultTo(0); // 0.00-100.00
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('last_attestation_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['pubkey']);
    table.index(['reputation']);
    table.index(['is_active']);
    table.index(['is_verified']);
    table.index(['accuracy_rate']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('providers');
};
