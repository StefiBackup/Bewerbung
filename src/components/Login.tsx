import { useState } from 'react'
import { ApiError } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { TextInput } from './ui'

export function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(username, password)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Anmeldung fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Bewerbungen</h1>
          <p className="text-sm text-slate-400 mt-2">Bitte anmelden, um fortzufahren.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6 space-y-4">
          <TextInput
            label="Benutzername"
            value={username}
            onChange={setUsername}
            placeholder="Benutzername"
          />
          <TextInput
            label="Passwort"
            value={password}
            onChange={setPassword}
            placeholder="Passwort"
            type="password"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !username || !password}
            className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {submitting ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-600">
          Neue Benutzer können nur vom Administrator angelegt werden.
        </p>
      </div>
    </div>
  )
}
