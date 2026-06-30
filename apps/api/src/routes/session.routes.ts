import { Hono } from 'hono'

import {
  ActiveOrganizationPreferenceError,
  getLoginContext,
  getSessionPayload,
  isSupportedLanguage,
  updateUserActiveOrganizationPreference,
  updateUserLanguagePreference,
} from '../services/session.service.js'
import type { AppEnv } from '../types/app-env.js'

export const sessionRoutes = new Hono<AppEnv>()

sessionRoutes.get('/login-context', async (c) => {
  const email = c.req.query('email')?.trim().toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ status: 'unknown' })
  }

  const context = await getLoginContext(email)

  return c.json(context)
})

sessionRoutes.get('/session', async (c) => {
  const user = c.get('user')
  const session = c.get('session')
  const studentSession = c.get('studentSession')

  if (!user || !session) {
    if (studentSession) {
      const activeMembership = {
        id: `student:${studentSession.student.id}`,
        role: 'student',
        permissions: [],
        organization: studentSession.organization,
      }

      return c.json({
        user: {
          id: `student:${studentSession.student.id}`,
          name: studentSession.student.fullName,
          email: '',
          platformRole: 'user',
          language: 'en',
        },
        session: {
          id: studentSession.id,
          userId: `student:${studentSession.student.id}`,
          expiresAt: studentSession.expiresAt,
        },
        preferences: {
          activeOrganizationId: studentSession.organization.id,
          language: 'en',
        },
        memberships: [activeMembership],
        activeMembership,
        activeStudent: {
          id: studentSession.student.id,
          fullName: studentSession.student.fullName,
          mustChangePassword: studentSession.student.credential?.mustChangePassword ?? false,
          nisn: studentSession.student.nisn,
          status: studentSession.student.status,
        },
        hasMultipleActiveMemberships: false,
        requiresOrganizationSelection: false,
      })
    }

    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sessionPayload = await getSessionPayload(user.id)

  return c.json({
    user: {
      ...user,
      language: sessionPayload.preferences.language,
    },
    session,
    ...sessionPayload,
  })
})

sessionRoutes.patch('/session/preferences/language', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json().catch(() => null)
  const language = typeof body?.language === 'string' ? body.language.trim() : ''

  if (!isSupportedLanguage(language)) {
    return c.json({ error: 'Language is not supported.' }, 400)
  }

  const preferences = await updateUserLanguagePreference(user.id, language)

  return c.json({ preferences })
})

sessionRoutes.patch('/session/preferences/active-organization', async (c) => {
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json().catch(() => null)
  const organizationId = typeof body?.organizationId === 'string' ? body.organizationId.trim() : ''

  if (!organizationId) {
    return c.json({ error: 'Organization is required.' }, 400)
  }

  try {
    const preferences = await updateUserActiveOrganizationPreference(user.id, organizationId)

    return c.json({ preferences })
  } catch (error) {
    if (error instanceof ActiveOrganizationPreferenceError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})
