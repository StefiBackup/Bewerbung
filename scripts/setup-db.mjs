import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { unlinkSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const envPath = join(root, '.env')

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/setup-db.mjs <postgres-passwort>')
  process.exit(1)
}

const encoded = encodeURIComponent(password)
const databaseUrl = `postgresql://postgres:${encoded}@localhost:5432/bewerbungen`
const jwtSecret = randomBytes(32).toString('base64url')

function setUserEnv(name, value) {
  process.env[name] = value

  if (process.platform === 'win32') {
    const escaped = value.replace(/'/g, "''")
    const result = spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `[Environment]::SetEnvironmentVariable('${name}', '${escaped}', 'User')`,
      ],
      { encoding: 'utf8' },
    )
    if (result.status !== 0) {
      throw new Error(`Konnte ${name} nicht setzen: ${result.stderr || result.stdout}`)
    }
    return
  }

  console.log(`export ${name}=${JSON.stringify(value)}`)
}

const pool = new pg.Pool({ connectionString: databaseUrl })

try {
  const { rows } = await pool.query('SELECT current_database() AS db')
  console.log('Verbindung OK:', rows[0].db)

  setUserEnv('DATABASE_URL', databaseUrl)
  setUserEnv('JWT_SECRET', jwtSecret)
  setUserEnv('PORT', '3001')

  console.log('Windows-Benutzerumgebungsvariablen gesetzt:')
  console.log('  DATABASE_URL, JWT_SECRET, PORT')

  if (existsSync(envPath)) {
    unlinkSync(envPath)
    console.log('.env entfernt (Zugangsdaten nur noch in den Umgebungsvariablen).')
  }

  await pool.query(`
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
  `)

  const { rows: count } = await pool.query('SELECT COUNT(*)::int AS c FROM users')
  if (count[0].c === 0) {
    console.log('Starte Server einmal mit npm run dev:server – Benutzer werden automatisch angelegt.')
  } else {
    console.log('Tabellen vorhanden,', count[0].c, 'Benutzer in der DB.')
  }

  console.log('\nFertig! Terminal/Cursor neu starten, dann: npm run dev')
} catch (err) {
  console.error('Fehler:', err instanceof Error ? err.message : err)
  process.exit(1)
} finally {
  await pool.end()
}
