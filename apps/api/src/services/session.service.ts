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

  return {
    memberships: serializedMemberships,
    activeMembership: serializedMemberships[0] ?? null,
  }
}
