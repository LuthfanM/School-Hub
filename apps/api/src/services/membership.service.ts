import { prisma } from '@schoolhub/database'

export async function getOrganizationMembership(userId: string, organizationId: string) {
  return prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
      role: true,
      organizationId: true,
      permissions: {
        select: {
          resource: true,
          action: true,
        },
      },
    },
  })
}

export function hasRole(membership: { role: string } | null, roles: string[]) {
  return Boolean(membership && roles.includes(membership.role))
}

export function canReadDashboardResource(
  membership: {
    role: string
    permissions: Array<{
      resource: string
      action: string
    }>
  } | null,
  resource: string
) {
  if (!membership) return false
  if (membership.role === 'owner') return true
  if (membership.role !== 'admin') return false

  // Legacy admins without explicit rows keep existing role-based access.
  if (membership.permissions.length === 0) return true

  return membership.permissions.some((permission) => {
    return (
      (permission.resource === 'dashboard' && permission.action === 'access-all') ||
      (permission.resource === `dashboard.${resource}` && permission.action === 'read')
    )
  })
}
