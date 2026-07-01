import { Hono } from 'hono'
import { z } from 'zod'

import { firstValidationMessage, optionalLowercaseEmail, optionalPassword, optionalTrimmedString } from '../lib/validation.js'
import {
  createPlatformTenant,
  listPlatformTenants,
  TenantConflictError,
  TenantResetPasswordError,
  requestTenantAdminPasswordReset,
} from '../services/platform-tenant.service.js'
import type { AppEnv } from '../types/app-env.js'

export const platformRoutes = new Hono<AppEnv>()

const createTenantSchema = z.object({
  name: z.string().trim().min(1, 'Tenant name is required.'),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only use lowercase letters, numbers, and hyphens.'),
  description: optionalTrimmedString(),
  customDomain: z.preprocess((value) => {
    if (typeof value !== 'string') return null

    const trimmed = value.trim()
    return trimmed ? trimmed.toLowerCase() : null
  }, z.string().nullable()),
  firstAdminEmail: optionalLowercaseEmail('First admin email is not valid.'),
  firstAdminPassword: optionalPassword('First admin password must be at least 8 characters.'),
})

const resetTenantAdminPasswordSchema = z.object({
  email: optionalLowercaseEmail('Admin email is not valid.'),
  redirectTo: z.preprocess((value) => {
    if (typeof value !== 'string') return `${process.env.WEB_ORIGIN ?? 'http://localhost:3000'}/auth/reset-password`

    const trimmed = value.trim()
    return trimmed || `${process.env.WEB_ORIGIN ?? 'http://localhost:3000'}/auth/reset-password`
  }, z.string()),
})

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

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const parsedBody = createTenantSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const tenant = await createPlatformTenant({
      name: parsedBody.data.name,
      slug: parsedBody.data.slug,
      description: parsedBody.data.description,
      customDomain: parsedBody.data.customDomain,
      firstAdminEmail: parsedBody.data.firstAdminEmail,
      firstAdminPassword: parsedBody.data.firstAdminPassword,
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

platformRoutes.post('/tenants/:tenantId/reset-password', async (c) => {
  const tenantId = c.req.param('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsedBody = resetTenantAdminPasswordSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const reset = await requestTenantAdminPasswordReset({
      email: parsedBody.data.email,
      organizationId: tenantId,
      redirectTo: parsedBody.data.redirectTo,
    })

    return c.json({ reset })
  } catch (error) {
    if (error instanceof TenantResetPasswordError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})
