-- Vetra Postgres bootstrap (docker-entrypoint-initdb.d)
-- Schema is applied via Knex migrations (`npm run db:migrate`).
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
