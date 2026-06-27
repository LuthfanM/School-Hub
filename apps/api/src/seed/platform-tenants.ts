import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { prisma } from '@schoolhub/database'

type TenantSeed = {
  name: string
  slug: string
  status: 'active' | 'pending_setup' | 'suspended'
  description: string
  customDomain?: string
  adminEmail: string
  adminName: string
}

const tenantSeeds: TenantSeed[] = [
  {
    name: 'Al Hikmah School',
    slug: 'al-hikmah',
    status: 'active',
    description: 'Primary tenant for Al Hikmah school operations.',
    customDomain: 'alhikmah.lessonhub.local',
    adminEmail: 'admin@alhikmah.sch.id',
    adminName: 'Admin Al Hikmah',
  },
  {
    name: 'Nusantara Academy',
    slug: 'nusantara-academy',
    status: 'pending_setup',
    description: 'Waiting for the first organization admin to accept their invitation.',
    customDomain: 'nusantara.lessonhub.local',
    adminEmail: 'owner@nusantara.edu',
    adminName: 'Owner Nusantara',
  },
  {
    name: 'Bina Insan Program',
    slug: 'bina-insan',
    status: 'suspended',
    description: 'Tenant marked for operational review.',
    customDomain: 'binainsan.lessonhub.local',
    adminEmail: 'ops@binainsan.org',
    adminName: 'Ops Bina Insan',
  },
  {
    name: 'Cendekia Learning',
    slug: 'cendekia',
    status: 'active',
    description: 'Active tenant for Cendekia learning program.',
    customDomain: 'cendekia.lessonhub.local',
    adminEmail: 'admin@cendekia.id',
    adminName: 'Admin Cendekia',
  },
]

const inviter = await prisma.user.findFirst({
  where: {
    email: process.env.SEED_INVITER_EMAIL,
    platformRole: 'platform_admin',
  },
  select: { id: true, email: true },
}) ?? await prisma.user.findFirst({
  where: { platformRole: 'platform_admin' },
  select: { id: true, email: true },
})

if (!inviter) {
  console.error('Seed a platform admin first with npm run seed:platform-admin, then rerun this tenant seed.')
  process.exit(1)
}

for (const tenantSeed of tenantSeeds) {
  const organization = await prisma.organization.upsert({
    where: { slug: tenantSeed.slug },
    create: {
      id: randomUUID(),
      name: tenantSeed.name,
      slug: tenantSeed.slug,
      status: tenantSeed.status,
      description: tenantSeed.description,
      customDomain: tenantSeed.customDomain,
    },
    update: {
      name: tenantSeed.name,
      status: tenantSeed.status,
      description: tenantSeed.description,
      customDomain: tenantSeed.customDomain,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  })

  if (tenantSeed.status === 'pending_setup') {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.invitation.upsert({
      where: {
        id: `${organization.id}:${tenantSeed.adminEmail}`,
      },
      create: {
        id: `${organization.id}:${tenantSeed.adminEmail}`,
        organizationId: organization.id,
        email: tenantSeed.adminEmail,
        role: 'owner',
        status: 'pending',
        expiresAt,
        inviterId: inviter.id,
      },
      update: {
        status: 'pending',
        expiresAt,
        inviterId: inviter.id,
      },
    })
  } else {
    const adminUser = await prisma.user.upsert({
      where: { email: tenantSeed.adminEmail },
      create: {
        id: randomUUID(),
        name: tenantSeed.adminName,
        email: tenantSeed.adminEmail,
        emailVerified: true,
      },
      update: {
        name: tenantSeed.adminName,
        emailVerified: true,
      },
      select: { id: true },
    })

    await prisma.member.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: adminUser.id,
        },
      },
      create: {
        id: randomUUID(),
        organizationId: organization.id,
        userId: adminUser.id,
        role: 'owner',
      },
      update: {
        role: 'owner',
      },
    })
  }

  console.log(`Seeded tenant: ${organization.name} (${organization.status})`)
}

console.log(`Tenant seed complete. Inviter: ${inviter.email}`)

await prisma.$disconnect()
