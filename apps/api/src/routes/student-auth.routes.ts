import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'

import {
  changeStudentPassword,
  loginStudent,
  logoutStudent,
  STUDENT_SESSION_COOKIE,
  StudentAuthError,
} from '../services/student-auth.service.js'
import type { AppEnv } from '../types/app-env.js'

export const studentAuthRoutes = new Hono<AppEnv>()

studentAuthRoutes.post('/student-auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const schoolCode = typeof body?.schoolCode === 'string' ? body.schoolCode.trim().toLowerCase() : ''
  const studentId = typeof body?.studentId === 'string' ? body.studentId.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!schoolCode || !studentId || !password) {
    return c.json({ error: 'Student credentials are invalid.' }, 400)
  }

  try {
    const result = await loginStudent({
      password,
      schoolCode,
      studentId,
    })

    setCookie(c, STUDENT_SESSION_COOKIE, result.token, {
      expires: result.expiresAt,
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return c.json({
      mustChangePassword: result.mustChangePassword,
      organization: result.organization,
      student: result.student,
    })
  } catch (error) {
    if (error instanceof StudentAuthError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})

studentAuthRoutes.post('/student-auth/change-password', async (c) => {
  const studentSession = c.get('studentSession')

  if (!studentSession) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json().catch(() => null)
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''

  try {
    await changeStudentPassword({
      newPassword,
      studentId: studentSession.studentId,
    })

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof StudentAuthError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})

studentAuthRoutes.post('/student-auth/logout', async (c) => {
  await logoutStudent(getCookie(c, STUDENT_SESSION_COOKIE))
  deleteCookie(c, STUDENT_SESSION_COOKIE, {
    path: '/',
  })

  return c.json({ success: true })
})
