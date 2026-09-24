/**
 * Allow pre-analysis (intercepted) rows: nullable risk fields + intercepted status.
 */

exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE transactions
      ALTER COLUMN risk_score DROP NOT NULL,
      ALTER COLUMN risk_level DROP NOT NULL,
      ALTER COLUMN analyzed_at DROP NOT NULL
  `);

  await knex.raw(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check`);

  await knex.raw(`
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_status_check
    CHECK (status = ANY (ARRAY[
      'intercepted'::text,
      'pending'::text,
      'approved'::text,
      'rejected'::text,
      'completed'::text
    ]))
  `);
};

exports.down = async function (knex) {
  await knex.raw(`
    UPDATE transactions
    SET risk_score = COALESCE(risk_score, 0),
        risk_level = COALESCE(risk_level, 'low'),
        status = CASE WHEN status = 'intercepted' THEN 'pending' ELSE status END,
        analyzed_at = COALESCE(analyzed_at, CURRENT_TIMESTAMP)
  `);

  await knex.raw(`ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check`);

  await knex.raw(`
    ALTER TABLE transactions
    ADD CONSTRAINT transactions_status_check
    CHECK (status = ANY (ARRAY[
      'pending'::text,
      'approved'::text,
      'rejected'::text,
      'completed'::text
    ]))
  `);

  await knex.raw(`
    ALTER TABLE transactions
      ALTER COLUMN risk_score SET NOT NULL,
      ALTER COLUMN risk_level SET NOT NULL
  `);
};
