import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'

import { firstValidationMessage } from '../lib/validation.js'
import {
  changeStudentPassword,
  loginStudent,
  logoutStudent,
  STUDENT_SESSION_COOKIE,
  StudentAuthError,
} from '../services/student-auth.service.js'
import type { AppEnv } from '../types/app-env.js'

export const studentAuthRoutes = new Hono<AppEnv>()

const studentLoginSchema = z.object({
  schoolCode: z.string().trim().toLowerCase().min(1, 'Student credentials are invalid.'),
  studentId: z.string().trim().min(1, 'Student credentials are invalid.'),
  password: z.string().min(1, 'Student credentials are invalid.'),
})

const studentChangePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
})

studentAuthRoutes.post('/student-auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsedBody = studentLoginSchema.safeParse(body)

  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const result = await loginStudent({
      password: parsedBody.data.password,
      schoolCode: parsedBody.data.schoolCode,
      studentId: parsedBody.data.studentId,
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
  const parsedBody = studentChangePasswordSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    await changeStudentPassword({
      newPassword: parsedBody.data.newPassword,
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
