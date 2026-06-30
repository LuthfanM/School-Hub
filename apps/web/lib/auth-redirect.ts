import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

interface AuthRedirectSession {
  user: {
    platformRole?: string | null
  }
  activeMembership?: unknown
  hasMultipleActiveMemberships?: boolean
  requiresOrganizationSelection?: boolean
}

export const getAuthRedirectTarget = createServerFn({ method: 'GET' }).handler(async () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const cookie = getRequestHeader('cookie')

  if (!cookie) {
    return null
  }

  const response = await fetch(`${apiBaseUrl}/api/session`, {
    headers: { cookie },
  })

  if (!response.ok) {
    return null
  }

  const session = (await response.json()) as AuthRedirectSession

  if (session.requiresOrganizationSelection || session.hasMultipleActiveMemberships) {
    return '/choose-organization'
  }

  if (session.user.platformRole === 'platform_admin' || session.activeMembership) {
    return '/dashboard'
  }

  return null
})
