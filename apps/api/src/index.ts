import 'dotenv/config'

import { serve } from '@hono/node-server'
import { prisma } from '@schoolhub/database'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { auth, type AuthSession } from './auth/index.js'

const app = new Hono<{
  Variables: {
    user: AuthSession['user'] | null
    session: AuthSession['session'] | null
  }
}>()

const port = Number(process.env.PORT ?? 4000)
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000'

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: webOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)

  await next()
})

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'schoolhub-api',
  })
})

app.get('/api/session', (c) => {
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ user, session })
})

app.get('/api/db-check', async (c) => {
  const result = await prisma.$queryRaw<Array<{ now: Date }>>`select now()`

  return c.json({
    ok: true,
    databaseTime: result[0]?.now,
  })
})

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`API server running on http://localhost:${info.port}`)
  }
)
