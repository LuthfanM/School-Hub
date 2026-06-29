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

  const activeMembership = serializedMemberships
    .filter((membership) => membership.organization.status === 'active')
    .reduce<(typeof serializedMemberships)[number] | null>((current, membership) => {
      if (!current) return membership

      return getMembershipRolePriority(membership.role) < getMembershipRolePriority(current.role)
        ? membership
        : current
    }, null)

  return {
    preferences: {
      language: normalizeLanguage(userPreferences.language),
    },
    memberships: serializedMemberships,
    activeMembership,
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

function getMembershipRolePriority(role: string) {
  if (role === 'owner') return 0
  if (role === 'admin') return 1
  if (role === 'teacher') return 2
  if (role === 'student') return 3

  return 4
}

function normalizeLanguage(language: string) {
  return isSupportedLanguage(language) ? language : 'en'
}
