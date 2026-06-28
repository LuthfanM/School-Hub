import { prisma } from '@schoolhub/database'

export async function getSessionPayload(userId: string) {
  const memberships = await prisma.member.findMany({
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
  })

  const serializedMemberships = memberships.map((membership) => ({
    id: membership.id,
    role: membership.role,
    permissions: membership.permissions,
    organization: membership.organization,
  }))

  const activeMembership = serializedMemberships.reduce<(typeof serializedMemberships)[number] | null>((current, membership) => {
    if (!current) return membership

    return getMembershipRolePriority(membership.role) < getMembershipRolePriority(current.role)
      ? membership
      : current
  }, null)

  return {
    memberships: serializedMemberships,
    activeMembership,
  }
}

function getMembershipRolePriority(role: string) {
  if (role === 'owner') return 0
  if (role === 'admin') return 1
  if (role === 'teacher') return 2
  if (role === 'student') return 3

  return 4
}
