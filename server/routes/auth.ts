import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findUserByUsername } from '../db.js'
import { requireAuth, signToken, type AuthedRequest } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/login', async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!username || !password) {
    res.status(400).json({ error: 'Benutzername und Passwort erforderlich' })
    return
  }

  try {
    const user = await findUserByUsername(username)
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Benutzername oder Passwort falsch' })
      return
    }

    const token = signToken({
      sub: user.id,
      username: user.username,
      role: user.role,
    })

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch {
    res.status(500).json({ error: 'Anmeldung fehlgeschlagen' })
  }
})

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({
    user: {
      id: req.user!.sub,
      username: req.user!.username,
      role: req.user!.role,
    },
  })
})
