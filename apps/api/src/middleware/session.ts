import type { MiddlewareHandler } from 'hono'
import { getCookie } from 'hono/cookie'

import { auth } from '../auth/index.js'
import { getStudentSession, STUDENT_SESSION_COOKIE } from '../services/student-auth.service.js'
import type { AppEnv } from '../types/app-env.js'

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)
  c.set('studentSession', await getStudentSession(getCookie(c, STUDENT_SESSION_COOKIE)))

  await next()
}
