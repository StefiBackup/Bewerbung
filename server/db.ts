import pg from 'pg'
import bcrypt from 'bcryptjs'
import type { AppStatePayload, PublicUser, UserRow } from './types.js'

const { Pool } = pg

const SEED_USERS = [
  { username: 'admin', password: 'admin', role: 'admin' as const },
  { username: 'Stefi', password: 'Stefi', role: 'user' as const },
  { username: 'Ensar', password: 'Ensar', role: 'user' as const },
]

const EMPTY_STATE: AppStatePayload = {
  applications: [],
  contacts: [],
  interviewNotes: [],
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL fehlt. Beispiel: postgresql://postgres:postgres@localhost:5432/bewerbungen',
    )
  }
  return url
}

function useSsl(): boolean | { rejectUnauthorized: boolean } {
  const url = process.env.DATABASE_URL ?? ''
  if (process.env.PGSSLMODE === 'disable') return false
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false
  return { rejectUnauthorized: false }
}

export const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: useSsl(),
})

pool.on('error', (err) => {
  console.error('PostgreSQL Pool-Fehler:', err)
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

async function seedUsers(client: pg.PoolClient) {
  const { rows } = await client.query<{ c: string }>('SELECT COUNT(*)::text AS c FROM users')
  if (Number(rows[0]?.c ?? 0) > 0) return

  const now = new Date().toISOString()

  for (const user of SEED_USERS) {
    const id = crypto.randomUUID()
    const passwordHash = bcrypt.hashSync(user.password, 10)

    await client.query(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, user.username, passwordHash, user.role, now],
    )

    await client.query(
      'INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, $3)',
      [id, JSON.stringify(EMPTY_STATE), now],
    )
  }
}

export async function initDb() {
  const client = await pool.connect()
  try {
    await client.query(SCHEMA_SQL)
    await seedUsers(client)
  } finally {
    client.release()
  }
}

export async function findUserByUsername(username: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, username, password_hash, role, created_at FROM users WHERE LOWER(username) = LOWER($1)',
    [username],
  )
  return rows[0]
}

export async function findUserById(id: string): Promise<UserRow | undefined> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, username, password_hash, role, created_at FROM users WHERE id = $1',
    [id],
  )
  return rows[0]
}

export async function listUsers(): Promise<PublicUser[]> {
  const { rows } = await pool.query<{
    id: string
    username: string
    role: 'admin' | 'user'
    created_at: string
  }>('SELECT id, username, role, created_at FROM users ORDER BY LOWER(username)')

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
  }))
}

export async function createUser(
  username: string,
  password: string,
  role: 'user' = 'user',
): Promise<PublicUser> {
  const existing = await findUserByUsername(username)
  if (existing) throw new Error('USERNAME_EXISTS')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const passwordHash = bcrypt.hashSync(password, 10)
  const trimmed = username.trim()

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES ($1, $2, $3, $4, $5)',
      [id, trimmed, passwordHash, role, now],
    )
    await client.query(
      'INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, $3)',
      [id, JSON.stringify(EMPTY_STATE), now],
    )
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return { id, username: trimmed, role, createdAt: now }
}

export async function getUserState(userId: string): Promise<AppStatePayload> {
  const { rows } = await pool.query<{ data: AppStatePayload }>(
    'SELECT data FROM user_data WHERE user_id = $1',
    [userId],
  )

  if (!rows[0]) {
    const now = new Date().toISOString()
    await pool.query(
      'INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, $3)',
      [userId, JSON.stringify(EMPTY_STATE), now],
    )
    return { ...EMPTY_STATE }
  }

  const parsed = rows[0].data
  return {
    applications: parsed.applications ?? [],
    contacts: parsed.contacts ?? [],
    interviewNotes: parsed.interviewNotes ?? [],
  }
}

export async function saveUserState(userId: string, state: AppStatePayload) {
  const now = new Date().toISOString()
  await pool.query(
    `INSERT INTO user_data (user_id, data, updated_at) VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
    [userId, JSON.stringify(state), now],
  )
}
