import type { AppState } from '../types'

export const STORAGE_KEY = 'bewerbungen-tracker-v1'

export const defaultState: AppState = {
  applications: [],
  contacts: [],
  interviewNotes: [],
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return {
      ...defaultState,
      ...parsed,
      applications: parsed.applications ?? [],
      contacts: parsed.contacts ?? [],
      interviewNotes: parsed.interviewNotes ?? [],
    }
  } catch {
    return defaultState
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function downloadBackup(state: AppState) {
  const blob = new Blob(
    [JSON.stringify({ ...state, exportedAt: new Date().toISOString(), version: 1 }, null, 2)],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bewerbungen-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importState(json: string): AppState {
  const parsed = JSON.parse(json)
  const { exportedAt: _, version: __, ...data } = parsed
  return {
    ...defaultState,
    ...data,
    applications: data.applications ?? [],
    contacts: data.contacts ?? [],
    interviewNotes: data.interviewNotes ?? [],
  }
}
