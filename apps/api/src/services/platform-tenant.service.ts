import { randomUUID } from 'node:crypto'

import { prisma } from '@schoolhub/database'

import { auth, getDevelopmentResetPasswordLink } from '../auth/index.js'

export interface CreateTenantInput {
  name: string
  slug: string
  description: string | null
  customDomain: string | null
  firstAdminEmail: string | null
  firstAdminPassword: string | null
  inviterId: string
}

export async function listPlatformTenants() {
  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          invitations: {
            where: { status: 'pending' },
          },
          members: true,
        },
      },
      members: {
        where: {
          role: { in: ['owner', 'admin'] },
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      invitations: {
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: {
          email: true,
        },
      },
    },
  })

  return organizations.map(serializeTenant)
}

export async function createPlatformTenant(input: CreateTenantInput) {
  const shouldProvisionFirstAdmin = Boolean(input.firstAdminEmail && input.firstAdminPassword)

  const existingOrganization = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: input.slug },
        ...(input.customDomain ? [{ customDomain: input.customDomain }] : []),
      ],
    },
    select: { id: true },
  })

  if (existingOrganization) {
    throw new TenantConflictError('Tenant slug or domain already exists.')
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const organization = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      customDomain: input.customDomain,
      status: input.firstAdminEmail && !shouldProvisionFirstAdmin ? 'pending_setup' : 'active',
      invitations: input.firstAdminEmail
        ? {
            create: {
              id: randomUUID(),
              email: input.firstAdminEmail,
              role: 'owner',
              status: 'pending',
              expiresAt,
              inviterId: input.inviterId,
            },
          }
        : undefined,
    },
  })

  if (input.firstAdminEmail && input.firstAdminPassword) {
    await provisionFirstOwner({
      email: input.firstAdminEmail,
      organizationId: organization.id,
      password: input.firstAdminPassword,
    })
  }

  const createdTenant = await prisma.organization.findUniqueOrThrow({
    where: { id: organization.id },
    include: {
      _count: {
        select: {
          invitations: {
            where: { status: 'pending' },
          },
          members: true,
        },
      },
      members: {
        where: {
          role: { in: ['owner', 'admin'] },
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      invitations: {
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: {
          email: true,
        },
      },
    },
  })

  return serializeTenant(createdTenant)
}

export async function requestTenantAdminPasswordReset({
  email,
  organizationId,
  redirectTo,
}: {
  email: string | null
  organizationId: string
  redirectTo: string
}) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      name: true,
      members: {
        where: {
          role: { in: ['owner', 'admin'] },
          ...(email
            ? {
                user: {
                  email,
                },
              }
            : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  })

  if (!organization) {
    throw new TenantResetPasswordError('Tenant was not found.')
  }

  const adminEmail = organization.members[0]?.user.email

  if (!adminEmail) {
    throw new TenantResetPasswordError('This tenant does not have an owner/admin user account to reset yet.')
  }

  await auth.api.requestPasswordReset({
    body: {
      email: adminEmail,
      redirectTo,
    },
  })

  return {
    email: adminEmail,
    resetUrl: getDevelopmentResetPasswordLink(adminEmail),
    tenantName: organization.name,
  }
}

async function provisionFirstOwner({
  email,
  organizationId,
  password,
}: {
  email: string
  organizationId: string
  password: string
}) {
  const existingAdmin = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!existingAdmin) {
    await auth.api.signUpEmail({
      body: {
        name: email.split('@')[0] ?? 'School Admin',
        email,
        password,
      },
    })

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    })
  }

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  })

  const existingMember = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: adminUser.id,
      },
    },
    select: {
      id: true,
    },
  })

  if (!existingMember) {
    await prisma.member.create({
      data: {
        id: randomUUID(),
        organizationId,
        userId: adminUser.id,
        role: 'owner',
      },
    })
  }

  await prisma.invitation.updateMany({
    where: {
      organizationId,
      email,
      role: 'owner',
      status: 'pending',
    },
    data: {
      status: 'accepted',
    },
  })
}

function serializeTenant(organization: {
  id: string
  name: string
  slug: string
  status: string
  description: string | null
  customDomain: string | null
  createdAt: Date
  _count: {
    invitations: number
    members: number
  }
  members: Array<{
    user: {
      email: string
    }
  }>
  invitations: Array<{
    email: string
  }>
}) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    description: organization.description,
    customDomain: organization.customDomain,
    firstAdminEmail:
      organization.members[0]?.user.email ??
      organization.invitations[0]?.email ??
      null,
    memberCount: organization._count.members,
    pendingInvitationCount: organization._count.invitations,
    createdAt: organization.createdAt.toISOString(),
  }
}

export class TenantConflictError extends Error {}
export class TenantResetPasswordError extends Error {}
