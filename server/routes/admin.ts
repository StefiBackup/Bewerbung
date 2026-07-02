import { Router } from 'express'
import { createUser, listUsers } from '../db.js'
import { requireAdmin, requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

adminRouter.get('/users', async (_req: AuthedRequest, res) => {
  try {
    const users = await listUsers()
    res.json({ users })
  } catch {
    res.status(500).json({ error: 'Benutzerliste konnte nicht geladen werden' })
  }
})

adminRouter.post('/users', async (req: AuthedRequest, res) => {
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
    const user = await createUser(username, password, 'user')
    res.status(201).json({ user })
  } catch (err) {
    if (err instanceof Error && err.message === 'USERNAME_EXISTS') {
      res.status(409).json({ error: 'Benutzername bereits vergeben' })
      return
    }
    res.status(500).json({ error: 'Benutzer konnte nicht angelegt werden' })
  }
})
