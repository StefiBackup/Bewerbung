import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { stateRouter } from './routes/state.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const DIST_PATH = join(__dirname, '..', 'dist')

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/state', stateRouter)

if (existsSync(join(DIST_PATH, 'index.html'))) {
  app.use(express.static(DIST_PATH))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(DIST_PATH, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server läuft auf http://localhost:${PORT}`)
})
