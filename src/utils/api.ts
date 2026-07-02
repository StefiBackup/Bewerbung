import type { AppState } from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'bewerbungen_auth_token'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface AuthUser {
  id: string
  username: string
  role: 'admin' | 'user'
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = 'Anfrage fehlgeschlagen'
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // ignore
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  login(username: string, password: string) {
    return request<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  me() {
    return request<{ user: AuthUser }>('/auth/me')
  },

  getState() {
    return request<AppState>('/state')
  },

  putState(state: AppState) {
    return request<{ ok: boolean }>('/state', {
      method: 'PUT',
      body: JSON.stringify(state),
    })
  },

  listUsers() {
    return request<{ users: Array<AuthUser & { createdAt: string }> }>('/admin/users')
  },

  createUser(username: string, password: string) {
    return request<{ user: AuthUser & { createdAt: string } }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
}
