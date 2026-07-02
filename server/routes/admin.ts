import { Router } from 'express'
import { createUser, listUsers } from '../db.js'
import { requireAdmin, requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

adminRouter.get('/users', (_req: AuthedRequest, res) => {
  res.json({ users: listUsers() })
})

adminRouter.post('/users', (req: AuthedRequest, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!username || !password) {
    res.status(400).json({ error: 'Benutzername und Passwort erforderlich' })
    return
  }

  if (password.length < 3) {
    res.status(400).json({ error: 'Passwort muss mindestens 3 Zeichen haben' })
    return
  }

  try {
    const user = createUser(username, password, 'user')
    res.status(201).json({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'USERNAME_EXISTS') {
      res.status(409).json({ error: 'Benutzername bereits vergeben' })
      return
    }
    res.status(500).json({ error: 'Benutzer konnte nicht angelegt werden' })
  }
})
