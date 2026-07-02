import { Router } from 'express'
import { getUserState, saveUserState } from '../db.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import type { AppStatePayload } from '../types.js'

export const stateRouter = Router()

stateRouter.use(requireAuth)

function isValidState(body: unknown): body is AppStatePayload {
  if (!body || typeof body !== 'object') return false
  const data = body as Record<string, unknown>
  return (
    Array.isArray(data.applications) &&
    Array.isArray(data.contacts) &&
    Array.isArray(data.interviewNotes)
  )
}

stateRouter.get('/', (req: AuthedRequest, res) => {
  const state = getUserState(req.user!.sub)
  res.json(state)
})

stateRouter.put('/', (req: AuthedRequest, res) => {
  if (!isValidState(req.body)) {
    res.status(400).json({ error: 'Ungültiges Datenformat' })
    return
  }

  saveUserState(req.user!.sub, req.body)
  res.json({ ok: true })
})
