export type UserRole = 'admin' | 'user'

export interface UserRow {
  id: string
  username: string
  password_hash: string
  role: UserRole
  created_at: string
}

export interface PublicUser {
  id: string
  username: string
  role: UserRole
  createdAt: string
}

export interface AppStatePayload {
  applications: unknown[]
  contacts: unknown[]
  interviewNotes: unknown[]
}

export interface JwtPayload {
  sub: string
  username: string
  role: UserRole
}
