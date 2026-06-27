import { Hono } from 'hono'

import { getSessionPayload } from '../services/session.service.js'
import type { AppEnv } from '../types/app-env.js'

export const sessionRoutes = new Hono<AppEnv>()

sessionRoutes.get('/session', async (c) => {
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sessionPayload = await getSessionPayload(user.id)

  return c.json({
    user,
    session,
    ...sessionPayload,
  })
})
