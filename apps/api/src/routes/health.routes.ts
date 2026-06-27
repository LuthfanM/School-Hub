import { prisma } from '@schoolhub/database'
import { Hono } from 'hono'

import type { AppEnv } from '../types/app-env.js'

export const healthRoutes = new Hono<AppEnv>()

healthRoutes.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'schoolhub-api',
  })
})

healthRoutes.get('/api/db-check', async (c) => {
  const result = await prisma.$queryRaw<Array<{ now: Date }>>`select now()`

  return c.json({
    ok: true,
    databaseTime: result[0]?.now,
  })
})
