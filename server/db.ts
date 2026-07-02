import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppStatePayload, PublicUser, UserRow } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = process.env.DB_PATH ?? join(__dirname, 'data', 'app.db')

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

mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }
  if (count.c > 0) return

  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
  )
  const insertData = db.prepare(
    'INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?)',
  )

  const now = new Date().toISOString()

  const tx = db.transaction(() => {
    for (const user of SEED_USERS) {
      const id = crypto.randomUUID()
      const passwordHash = bcrypt.hashSync(user.password, 10)
      insertUser.run(id, user.username, passwordHash, user.role, now)
      insertData.run(id, JSON.stringify(EMPTY_STATE), now)
    }
  })

  tx()
}

seedUsers()

export function findUserByUsername(username: string): UserRow | undefined {
  return db
    .prepare('SELECT id, username, password_hash, role, created_at FROM users WHERE username = ? COLLATE NOCASE')
    .get(username) as UserRow | undefined
}

export function findUserById(id: string): UserRow | undefined {
  return db
    .prepare('SELECT id, username, password_hash, role, created_at FROM users WHERE id = ?')
    .get(id) as UserRow | undefined
}

export function listUsers(): PublicUser[] {
  const rows = db
    .prepare('SELECT id, username, role, created_at FROM users ORDER BY username COLLATE NOCASE')
    .all() as Array<{ id: string; username: string; role: 'admin' | 'user'; created_at: string }>

  return rows.map((row) => ({
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.created_at,
  }))
}

export function createUser(username: string, password: string, role: 'user' = 'user'): PublicUser {
  const existing = findUserByUsername(username)
  if (existing) throw new Error('USERNAME_EXISTS')

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const passwordHash = bcrypt.hashSync(password, 10)

  const tx = db.transaction(() => {
    db.prepare(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, username.trim(), passwordHash, role, now)

    db.prepare('INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?)').run(
      id,
      JSON.stringify(EMPTY_STATE),
      now,
    )
  })

  tx()

  return { id, username: username.trim(), role, createdAt: now }
}

export function getUserState(userId: string): AppStatePayload {
  const row = db
    .prepare('SELECT data FROM user_data WHERE user_id = ?')
    .get(userId) as { data: string } | undefined

  if (!row) {
    const now = new Date().toISOString()
    db.prepare('INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?)').run(
      userId,
      JSON.stringify(EMPTY_STATE),
      now,
    )
    return { ...EMPTY_STATE }
  }

  try {
    const parsed = JSON.parse(row.data) as Partial<AppStatePayload>
    return {
      applications: parsed.applications ?? [],
      contacts: parsed.contacts ?? [],
      interviewNotes: parsed.interviewNotes ?? [],
    }
  } catch {
    return { ...EMPTY_STATE }
  }
}

export function saveUserState(userId: string, state: AppStatePayload) {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
  ).run(userId, JSON.stringify(state), now)
}
