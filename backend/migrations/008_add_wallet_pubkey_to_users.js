/**
 * Migration: add wallet_pubkey to users for Solana attestations
 */

exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.string('wallet_pubkey', 64).nullable().unique();
    table.index(['wallet_pubkey']);
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropIndex(['wallet_pubkey']);
    table.dropColumn('wallet_pubkey');
  });
};
