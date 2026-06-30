import { prisma } from '@schoolhub/database'

export const SUPPORTED_LANGUAGES = ['en', 'id', 'ja', 'ko'] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

interface SessionMembershipRecord {
  id: string
  role: string
  permissions: Array<{
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

export async function getSessionPayload(userId: string) {
  const [userPreferences, memberships] = await prisma.$transaction([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        activeOrganizationId: true,
        language: true,
      },
    }),
    prisma.member.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        permissions: {
          select: {
            resource: true,
            action: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    }),
  ])

  const serializedMemberships = memberships.map((membership: SessionMembershipRecord) => ({
    id: membership.id,
    role: membership.role,
    permissions: membership.permissions,
    organization: membership.organization,
  }))

  const activeMemberships = serializedMemberships.filter((membership) => membership.organization.status === 'active')
  const preferredMembership = activeMemberships.find((membership) => {
    return membership.organization.id === userPreferences.activeOrganizationId
  }) ?? null
  const activeMembership = preferredMembership ?? (activeMemberships.length === 1 ? activeMemberships[0] ?? null : null)

  return {
    preferences: {
      activeOrganizationId: activeMembership?.organization.id ?? null,
      language: normalizeLanguage(userPreferences.language),
    },
    memberships: serializedMemberships,
    activeMembership,
    hasMultipleActiveMemberships: activeMemberships.length > 1,
    requiresOrganizationSelection: activeMemberships.length > 1 && !activeMembership,
  }
}

export async function updateUserActiveOrganizationPreference(userId: string, organizationId: string) {
  const membership = await prisma.member.findFirst({
    where: {
      userId,
      organizationId,
      organization: {
        status: 'active',
      },
    },
    select: {
      organizationId: true,
    },
  })

  if (!membership) {
    throw new ActiveOrganizationPreferenceError('Organization is not available for this account.')
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      activeOrganizationId: membership.organizationId,
    },
  })

  return {
    activeOrganizationId: membership.organizationId,
  }
}

export async function updateUserLanguagePreference(userId: string, language: string) {
  const normalizedLanguage = normalizeLanguage(language)

  await prisma.user.update({
    where: { id: userId },
    data: {
      language: normalizedLanguage,
    },
  })

  return {
    language: normalizedLanguage,
  }
}

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
}

export class ActiveOrganizationPreferenceError extends Error {}

export async function getLoginContext(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      platformRole: true,
      organizationMembers: {
        select: {
          organization: {
            select: {
              name: true,
              status: true,
            },
          },
        },
      },
    },
  })

  if (user) {
    const hasActiveMembership = user.organizationMembers.some((membership) => {
      return membership.organization.status === 'active'
    })

    if (user.platformRole === 'platform_admin' || hasActiveMembership) {
      return { status: 'ok' as const }
    }

    const suspendedOrganization = user.organizationMembers.find((membership) => {
      return membership.organization.status === 'suspended'
    })?.organization

    if (suspendedOrganization) {
      return {
        status: 'suspended' as const,
        organizationName: suspendedOrganization.name,
      }
    }
  }

  const pendingInvitation = await prisma.invitation.findFirst({
    where: {
      email: normalizedEmail,
      status: 'pending',
      organization: {
        status: 'pending_setup',
      },
    },
    select: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  })

  if (pendingInvitation) {
    return {
      status: 'pending_setup' as const,
      organizationName: pendingInvitation.organization.name,
    }
  }

  return { status: 'unknown' as const }
}

function normalizeLanguage(language: string) {
  return isSupportedLanguage(language) ? language : 'en'
}
