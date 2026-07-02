import { useEffect, useState } from 'react'
import { ApiError, api } from '../utils/api'
import { TextInput } from './ui'

interface AdminUser {
  id: string
  username: string
  role: 'admin' | 'user'
  createdAt: string
}

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadUsers = async () => {
    setError('')
    try {
      const { users: list } = await api.listUsers()
      setUsers(list)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Benutzerliste konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const createdName = username
      await api.createUser(username, password)
      setUsername('')
      setPassword('')
      setSuccess(`Benutzer „${createdName}" wurde angelegt.`)
      await loadUsers()
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Benutzer konnte nicht angelegt werden')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Benutzerverwaltung</h2>
        <p className="text-sm text-slate-400 mt-1">Nur du als Admin kannst neue Benutzer registrieren.</p>
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border border-indigo-500/30 bg-slate-800/30 p-5 space-y-4">
        <h3 className="text-sm font-medium text-slate-300">Neuen Benutzer anlegen</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextInput label="Benutzername" value={username} onChange={setUsername} placeholder="z.B. Max" />
          <TextInput label="Passwort" value={password} onChange={setPassword} placeholder="Passwort" type="password" />
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">{success}</p>
        )}
        <button
          type="submit"
          disabled={submitting || !username || !password}
          className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white"
        >
          {submitting ? 'Wird angelegt…' : 'Benutzer registrieren'}
        </button>
      </form>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-medium text-slate-300">Alle Benutzer</h3>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Lade Benutzer…</p>
        ) : (
          <ul className="divide-y divide-slate-700/50">
            {users.map((user) => (
              <li key={user.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white font-medium">{user.username}</p>
                  <p className="text-xs text-slate-500">
                    {user.role === 'admin' ? 'Administrator' : 'Benutzer'} · seit {user.createdAt.slice(0, 10)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-700 text-slate-400 border-slate-600'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
