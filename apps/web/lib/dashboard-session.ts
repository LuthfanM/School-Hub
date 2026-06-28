import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

interface DashboardSessionUser {
  id: string
  name?: string | null
  email: string
  platformRole?: string | null
}

interface DashboardSessionMembership {
  id: string
  role: string
  permissions?: Array<{
    resource: string
    action: string
  }>
  organization: {
    id: string
    name: string
    slug: string
    status: string
  }
}

interface DashboardSession {
  user: DashboardSessionUser
  memberships?: DashboardSessionMembership[]
  activeMembership?: DashboardSessionMembership | null
}

export const getDashboardSession = createServerFn({ method: 'GET' }).handler(async () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const cookie = getRequestHeader('cookie')
  const response = await fetch(`${apiBaseUrl}/api/session`, {
    headers: cookie ? { cookie } : undefined,
  })

  if (!response.ok) {
    throw redirect({ to: '/auth/login' })
  }

  const session = (await response.json()) as DashboardSession
  const isPlatformAdmin = session.user.platformRole === 'platform_admin'

  if (!isPlatformAdmin && !session.activeMembership) {
    throw redirect({ to: '/auth/login' })
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      platformRole: session.user.platformRole ?? 'user',
    },
    memberships: session.memberships ?? [],
    activeMembership: session.activeMembership ?? null,
  }
})
