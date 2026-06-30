import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

interface OrganizationSelectionMembership {
  id: string
  role: string
  organization: {
    id: string
    name: string
    slug: string
    status: string
  }
}

interface OrganizationSelectionSession {
  user: {
    platformRole?: string | null
  }
  memberships: OrganizationSelectionMembership[]
  activeMembership?: OrganizationSelectionMembership | null
  hasMultipleActiveMemberships?: boolean
  requiresOrganizationSelection?: boolean
}

export const getOrganizationSelectionSession = createServerFn({ method: 'GET' }).handler(async () => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
  const cookie = getRequestHeader('cookie')

  if (!cookie) {
    throw redirect({ to: '/auth/login' })
  }

  const response = await fetch(`${apiBaseUrl}/api/session`, {
    headers: { cookie },
  })

  if (!response.ok) {
    throw redirect({ to: '/auth/login' })
  }

  const session = (await response.json()) as OrganizationSelectionSession

  return {
    ...session,
    memberships: session.memberships ?? [],
  }
})
