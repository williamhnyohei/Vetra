/**
 * Allow NULL user_id in transactions table
 * This enables saving transactions from non-authenticated users
 */

exports.up = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.uuid('user_id').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('transactions', function(table) {
    table.uuid('user_id').notNullable().alter();
  });
};

