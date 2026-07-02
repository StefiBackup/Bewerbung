import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { Application, AppState, Contact, InterviewNote } from '../types'
import { api } from '../utils/api'
import { defaultState, downloadBackup, importState } from '../utils/storage'

export function useStoreValue(enabled: boolean) {
  const [state, setState] = useState<AppState>(defaultState)
  const [loading, setLoading] = useState(enabled)
  const [ready, setReady] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setState(defaultState)
      setLoading(false)
      setReady(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setReady(false)

    api
      .getState()
      .then((data) => {
        if (!cancelled) {
          setState({
            applications: data.applications ?? [],
            contacts: data.contacts ?? [],
            interviewNotes: data.interviewNotes ?? [],
          })
        }
      })
      .catch((err) => {
        console.error('Daten konnten nicht geladen werden', err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setReady(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || !ready || loading) return

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.putState(state).catch((err) => {
        console.error('Speichern fehlgeschlagen', err)
      })
    }, 500)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, enabled, ready, loading])

  const update = useCallback((fn: (prev: AppState) => AppState) => {
    setState(fn)
  }, [])

  const addApplication = useCallback((app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    update((prev) => ({
      ...prev,
      applications: [...prev.applications, { ...app, id, createdAt: now, updatedAt: now }],
    }))
    return id
  }, [update])

  const updateApplication = useCallback((id: string, patch: Partial<Application>) => {
    update((prev) => ({
      ...prev,
      applications: prev.applications.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
      ),
    }))
  }, [update])

  const deleteApplication = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      applications: prev.applications.filter((a) => a.id !== id),
    }))
  }, [update])

  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID()
    update((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { ...contact, id, createdAt: new Date().toISOString() }],
    }))
    return id
  }, [update])

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    update((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }, [update])

  const deleteContact = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.id !== id),
      applications: prev.applications.map((a) =>
        a.contactId === id ? { ...a, contactId: null } : a,
      ),
    }))
  }, [update])

  const addInterviewNote = useCallback((note: Omit<InterviewNote, 'id'>) => {
    const id = crypto.randomUUID()
    update((prev) => ({
      ...prev,
      interviewNotes: [...prev.interviewNotes, { ...note, id }],
    }))
    return id
  }, [update])

  const updateInterviewNote = useCallback((id: string, patch: Partial<InterviewNote>) => {
    update((prev) => ({
      ...prev,
      interviewNotes: prev.interviewNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }))
  }, [update])

  const deleteInterviewNote = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      interviewNotes: prev.interviewNotes.filter((n) => n.id !== id),
    }))
  }, [update])

  const exportBackup = useCallback(() => {
    downloadBackup(state)
  }, [state])

  const restoreBackup = useCallback((json: string) => {
    setState(importState(json))
  }, [])

  return {
    state,
    loading,
    addApplication,
    updateApplication,
    deleteApplication,
    addContact,
    updateContact,
    deleteContact,
    addInterviewNote,
    updateInterviewNote,
    deleteInterviewNote,
    exportBackup,
    restoreBackup,
  }
}

const StoreContext = createContext<ReturnType<typeof useStoreValue> | null>(null)

export function StoreProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const value = useStoreValue(enabled)
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
