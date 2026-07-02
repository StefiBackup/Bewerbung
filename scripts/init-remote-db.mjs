/**
 * Legt Tabellen in einer Neon/PostgreSQL-Datenbank an (einmalig vor dem ersten Render-Deploy).
 * Usage: DATABASE_URL="postgresql://..." node scripts/init-remote-db.mjs
 */
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL fehlt')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: url.includes('localhost') ? false : { rejectUnauthorized: false },
})

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users (LOWER(username));
  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`

try {
  await pool.query(SCHEMA_SQL)
  console.log('Tabellen erstellt.')
} catch (err) {
  console.error(err)
  process.exit(1)
} finally {
  await pool.end()
}
