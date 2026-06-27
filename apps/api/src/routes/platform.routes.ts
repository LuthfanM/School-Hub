import { Hono } from 'hono'

import {
  createPlatformTenant,
  listPlatformTenants,
  TenantConflictError,
} from '../services/platform-tenant.service.js'
import type { AppEnv } from '../types/app-env.js'

export const platformRoutes = new Hono<AppEnv>()

platformRoutes.use('*', async (c, next) => {
  const user = c.get('user')

  if (user?.platformRole !== 'platform_admin') {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await next()
})

platformRoutes.get('/tenants', async (c) => {
  const tenants = await listPlatformTenants()

  return c.json({ tenants })
})

platformRoutes.post('/tenants', async (c) => {
  const user = c.get('user')
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

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

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

  try {
    const tenant = await createPlatformTenant({
      name,
      slug,
      description,
      customDomain,
      firstAdminEmail,
      firstAdminPassword,
      inviterId: user.id,
    })

    return c.json({ tenant }, 201)
  } catch (error) {
    if (error instanceof TenantConflictError) {
      return c.json({ error: error.message }, 409)
    }

    throw error
  }
})
