import { randomUUID } from 'node:crypto'

import { prisma, type Prisma } from '@schoolhub/database'

import { auth } from '../auth/index.js'
import { getPaginationMeta, type PaginationInput } from '../lib/pagination.js'

export const ADMIN_PERMISSION_ALL = {
  resource: 'dashboard',
  action: 'access-all',
} as const

export const ADMIN_DASHBOARD_RESOURCES = [
  'students',
  'teachers',
  'classes',
  'attendance',
  'assignments',
  'grades',
  'messages',
  'reports',
  'billing',
  'settings',
] as const

export type AdminDashboardResource = typeof ADMIN_DASHBOARD_RESOURCES[number]

export interface CreateOrganizationAdminInput {
  organizationId: string
  name: string
  email: string
  password: string | null
  accessMode: 'all' | 'custom'
  permissions: AdminDashboardResource[]
}

export interface UpdateOrganizationAdminPermissionsInput {
  adminId: string
  organizationId: string
  accessMode: 'all' | 'custom'
  permissions: AdminDashboardResource[]
}

export async function listOrganizationAdmins({
  organizationId,
  pagination,
  search,
}: {
  organizationId: string
  pagination: PaginationInput
  search?: string
}) {
  const where: Prisma.MemberWhereInput = {
    organizationId,
    role: 'admin',
    ...(search
      ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  }

  const [admins, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        id: true,
        role: true,
        createdAt: true,
        permissions: {
          select: {
            resource: true,
            action: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
          },
        },
      },
    }),
    prisma.member.count({ where }),
  ])

  return {
    data: admins.map((admin: Parameters<typeof serializeAdmin>[0]) => serializeAdmin(admin)),
    pagination: getPaginationMeta(pagination.page, pagination.limit, total),
  }
}

export async function createOrganizationAdmin(input: CreateOrganizationAdminInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })

  if (!existingUser && !input.password) {
    throw new AdminProvisioningError('Password is required when creating a new admin user locally.')
  }

  if (!existingUser && input.password) {
    await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
      },
    })

    await prisma.user.update({
      where: { email: input.email },
      data: { emailVerified: true },
    })
  }

  const adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: input.email },
    select: { id: true },
  })

  const existingMember = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: adminUser.id,
      },
    },
    select: {
      role: true,
    },
  })

  if (existingMember?.role === 'admin') {
    throw new AdminProvisioningError('This person is already an admin in this school.')
  }

  if (existingMember) {
    throw new AdminProvisioningError('This person already has access to this school.')
  }

  const member = await prisma.member.create({
    data: {
      id: randomUUID(),
      organizationId: input.organizationId,
      userId: adminUser.id,
      role: 'admin',
    },
    select: {
      id: true,
    },
  })

  await replaceAdminPermissions({
    accessMode: input.accessMode,
    memberId: member.id,
    permissions: input.permissions,
  })

  const createdAdmin = await prisma.member.findUniqueOrThrow({
    where: { id: member.id },
    select: {
      id: true,
      role: true,
      createdAt: true,
      permissions: {
        select: {
          resource: true,
          action: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
        },
      },
    },
  })

  return serializeAdmin(createdAdmin)
}

export async function updateOrganizationAdminPermissions(input: UpdateOrganizationAdminPermissionsInput) {
  const admin = await prisma.member.findFirst({
    where: {
      id: input.adminId,
      organizationId: input.organizationId,
      role: 'admin',
    },
    select: { id: true },
  })

  if (!admin) {
    throw new AdminNotFoundError('Admin member was not found in this organization.')
  }

  await replaceAdminPermissions({
    accessMode: input.accessMode,
    memberId: admin.id,
    permissions: input.permissions,
  })

  const updatedAdmin = await prisma.member.findUniqueOrThrow({
    where: { id: admin.id },
    select: {
      id: true,
      role: true,
      createdAt: true,
      permissions: {
        select: {
          resource: true,
          action: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
        },
      },
    },
  })

  return serializeAdmin(updatedAdmin)
}

export async function deleteOrganizationAdmin({
  adminId,
  organizationId,
}: {
  adminId: string
  organizationId: string
}) {
  const admin = await prisma.member.findFirst({
    where: {
      id: adminId,
      organizationId,
      role: 'admin',
    },
    select: { id: true },
  })

  if (!admin) {
    throw new AdminNotFoundError('Admin member was not found in this organization.')
  }

  await prisma.member.delete({
    where: { id: admin.id },
  })
}

async function replaceAdminPermissions({
  accessMode,
  memberId,
  permissions,
}: {
  accessMode: 'all' | 'custom'
  memberId: string
  permissions: AdminDashboardResource[]
}) {
  const permissionRows = accessMode === 'all'
    ? [ADMIN_PERMISSION_ALL]
    : permissions.map((permission) => ({
        resource: `dashboard.${permission}`,
        action: 'read',
      }))

  await prisma.$transaction([
    prisma.memberPermission.deleteMany({
      where: { memberId },
    }),
    ...(permissionRows.length > 0
      ? [
          prisma.memberPermission.createMany({
            data: permissionRows.map((permission) => ({
              memberId,
              resource: permission.resource,
              action: permission.action,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ])
}

function serializeAdmin(admin: {
  id: string
  role: string
  createdAt: Date
  permissions: Array<{
    resource: string
    action: string
  }>
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
  }
}) {
  const hasAllAccess = admin.permissions.some((permission) => {
    return permission.resource === ADMIN_PERMISSION_ALL.resource && permission.action === ADMIN_PERMISSION_ALL.action
  })
  const permissions = admin.permissions
    .filter((permission) => permission.resource.startsWith('dashboard.') && permission.action === 'read')
    .map((permission) => permission.resource.replace('dashboard.', ''))

  return {
    id: admin.id,
    role: admin.role,
    accessMode: hasAllAccess ? 'all' : 'custom',
    permissions,
    createdAt: admin.createdAt.toISOString(),
    user: admin.user,
  }
}

export class AdminProvisioningError extends Error {}
export class AdminNotFoundError extends Error {}
