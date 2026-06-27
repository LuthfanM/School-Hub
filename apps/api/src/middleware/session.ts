import type { MiddlewareHandler } from 'hono'

import { auth } from '../auth/index.js'
import type { AppEnv } from '../types/app-env.js'

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)

  await next()
}
