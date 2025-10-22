/**
 * Create users table
 * Stores user authentication and profile information
 */

exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('name').notNullable();
    table.string('avatar_url');
    table.enum('provider', ['google', 'guest']).notNullable();
    table.string('provider_id');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.enum('subscription_plan', ['free', 'pro']).defaultTo('free');
    table.timestamp('subscription_expires_at');
    table.jsonb('preferences').defaultTo('{}');
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('last_login_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes
    table.index(['email']);
    table.index(['provider', 'provider_id']);
    table.index(['subscription_plan']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
