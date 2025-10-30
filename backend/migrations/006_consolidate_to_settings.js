/**
 * Consolidate preferences and settings into a single settings column
 */

exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // First, we'll use raw SQL to merge preferences into settings
  }).then(() => {
    // Merge preferences into settings
    return knex.raw(`
      UPDATE users
      SET settings = settings || preferences,
          updated_at = CURRENT_TIMESTAMP
      WHERE preferences IS NOT NULL 
        AND preferences != '{}'::jsonb
    `);
  }).then(() => {
    // Drop the preferences column
    return knex.schema.table('users', function(table) {
      table.dropColumn('preferences');
    });
  });
};

exports.down = function(knex) {
  // Recreate preferences column if we need to rollback
  return knex.schema.table('users', function(table) {
    table.jsonb('preferences').defaultTo('{}');
  });
};

