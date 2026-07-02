import { AuthProvider, useAuth } from './hooks/useAuth'
import { StoreProvider } from './hooks/useStore'
import { Login } from './components/Login'
import { BewerbungenView } from './components/BewerbungenView'

function AppContent() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Lade…
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <StoreProvider enabled>
      <div className="min-h-screen bg-slate-950">
        <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
          <BewerbungenView user={user} onLogout={logout} />
        </main>
      </div>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
