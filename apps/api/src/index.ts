import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { serve } from '@hono/node-server'
import { prisma } from '@schoolhub/database'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import { auth, type AuthSession } from './auth/index.js'

const app = new Hono<{
  Variables: {
    user: AuthSession['user'] | null
    session: AuthSession['session'] | null
  }
}>()

const port = Number(process.env.PORT ?? 4000)
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3000'

app.use('*', logger())
app.use(
  '*',
  cors({
    origin: webOrigin,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

app.use('*', async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  c.set('user', session?.user ?? null)
  c.set('session', session?.session ?? null)

  await next()
})

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'schoolhub-api',
  })
})

app.get('/api/session', (c) => {
  const user = c.get('user')
  const session = c.get('session')

  if (!user || !session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({ user, session })
})

app.get('/api/db-check', async (c) => {
  const result = await prisma.$queryRaw<Array<{ now: Date }>>`select now()`

  return c.json({
    ok: true,
    databaseTime: result[0]?.now,
  })
})

app.get('/api/platform/tenants', async (c) => {
  const user = c.get('user')

  if (user?.platformRole !== 'platform_admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

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

  return c.json({
    tenants: organizations.map((organization) => ({
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
    })),
  })
})

app.post('/api/platform/tenants', async (c) => {
  const user = c.get('user')

  if (user?.platformRole !== 'platform_admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const slug = typeof body?.slug === 'string' ? body.slug.trim().toLowerCase() : ''
  const description =
    typeof body?.description === 'string' && body.description.trim()
      ? body.description.trim()
      : null
  const customDomain =
    typeof body?.customDomain === 'string' && body.customDomain.trim()
      ? body.customDomain.trim().toLowerCase()
      : null
  const firstAdminEmail =
    typeof body?.firstAdminEmail === 'string' && body.firstAdminEmail.trim()
      ? body.firstAdminEmail.trim().toLowerCase()
      : null
  const firstAdminPassword =
    typeof body?.firstAdminPassword === 'string' && body.firstAdminPassword.trim()
      ? body.firstAdminPassword
      : null
  const shouldProvisionFirstAdmin = Boolean(firstAdminEmail && firstAdminPassword)

  if (!name) {
    return c.json({ error: 'Tenant name is required.' }, 400)
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return c.json({ error: 'Slug can only use lowercase letters, numbers, and hyphens.' }, 400)
  }

  if (firstAdminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(firstAdminEmail)) {
    return c.json({ error: 'First admin email is not valid.' }, 400)
  }

  if (firstAdminPassword && firstAdminPassword.length < 8) {
    return c.json({ error: 'First admin password must be at least 8 characters.' }, 400)
  }

  const existingOrganization = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug },
        ...(customDomain ? [{ customDomain }] : []),
      ],
    },
    select: { id: true },
  })

  if (existingOrganization) {
    return c.json({ error: 'Tenant slug or domain already exists.' }, 409)
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const organization = await prisma.organization.create({
    data: {
      id: randomUUID(),
      name,
      slug,
      description,
      customDomain,
      status: firstAdminEmail && !shouldProvisionFirstAdmin ? 'pending_setup' : 'active',
      invitations: firstAdminEmail
        ? {
            create: {
              id: randomUUID(),
              email: firstAdminEmail,
              role: 'admin',
              status: 'pending',
              expiresAt,
              inviterId: user.id,
            },
          }
        : undefined,
    },
  })

  if (firstAdminEmail && firstAdminPassword) {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: firstAdminEmail },
      select: { id: true },
    })

    if (!existingAdmin) {
      await auth.api.signUpEmail({
        body: {
          name: firstAdminEmail.split('@')[0] ?? 'School Admin',
          email: firstAdminEmail,
          password: firstAdminPassword,
        },
      })
    }

    const adminUser = await prisma.user.update({
      where: { email: firstAdminEmail },
      data: {
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
        role: 'admin',
      },
      update: {
        role: 'admin',
      },
    })

    await prisma.invitation.updateMany({
      where: {
        organizationId: organization.id,
        email: firstAdminEmail,
        role: 'admin',
        status: 'pending',
      },
      data: {
        status: 'accepted',
      },
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

  return c.json({
    tenant: {
      id: createdTenant.id,
      name: createdTenant.name,
      slug: createdTenant.slug,
      status: createdTenant.status,
      description: createdTenant.description,
      customDomain: createdTenant.customDomain,
      firstAdminEmail:
        createdTenant.members[0]?.user.email ??
        createdTenant.invitations[0]?.email ??
        null,
      memberCount: createdTenant._count.members,
      pendingInvitationCount: createdTenant._count.invitations,
      createdAt: createdTenant.createdAt.toISOString(),
    },
  }, 201)
})

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`API server running on http://localhost:${info.port}`)
  }
)
