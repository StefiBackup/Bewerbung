import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { findUserById } from '../db.js'
import type { JwtPayload } from '../types.js'

const JWT_SECRET = process.env.JWT_SECRET ?? 'bewerbungen-dev-secret-change-in-production'

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}

export interface AuthedRequest extends Request {
  user?: JwtPayload
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Nicht angemeldet' })
    return
  }

  try {
    const payload = verifyToken(header.slice(7))
    const user = await findUserById(payload.sub)
    if (!user) {
      res.status(401).json({ error: 'Benutzer nicht gefunden' })
      return
    }
    req.user = {
      sub: user.id,
      username: user.username,
      role: user.role,
    }
    next()
  } catch {
    res.status(401).json({ error: 'Sitzung abgelaufen' })
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Nur für Administratoren' })
    return
  }
  next()
}
