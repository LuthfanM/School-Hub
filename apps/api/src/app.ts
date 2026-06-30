import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { auth } from './auth/index.js'
import { sessionMiddleware } from './middleware/session.js'
import { healthRoutes } from './routes/health.routes.js'
import { organizationRoutes } from './routes/organization.routes.js'
import { platformRoutes } from './routes/platform.routes.js'
import { sessionRoutes } from './routes/session.routes.js'
import { studentAuthRoutes } from './routes/student-auth.routes.js'
import type { AppEnv } from './types/app-env.js'

export function createApp() {
  const app = new Hono<AppEnv>()
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

  app.use('*', sessionMiddleware)

  app.on(['GET', 'POST'], '/api/auth/*', (c) => {
    return auth.handler(c.req.raw)
  })

  app.route('/', healthRoutes)
  app.route('/api', sessionRoutes)
  app.route('/api', studentAuthRoutes)
  app.route('/api/organizations', organizationRoutes)
  app.route('/api/platform', platformRoutes)

  app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404)
  })

  return app
}
