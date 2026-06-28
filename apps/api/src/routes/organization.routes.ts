import { Hono } from 'hono'

import { getPagination } from '../lib/pagination.js'
import {
  ADMIN_DASHBOARD_RESOURCES,
  AdminProvisioningError,
  createOrganizationAdmin,
  listOrganizationAdmins,
  type AdminDashboardResource,
} from '../services/organization-admin.service.js'
import {
  DirectoryProvisioningError,
  createStudent,
  createTeacher,
  listStudents,
  listTeachers,
} from '../services/organization-directory.service.js'
import {
  canManageDashboardResource,
  canReadDashboardResource,
  getOrganizationMembership,
  hasRole,
} from '../services/membership.service.js'
import type { AppEnv } from '../types/app-env.js'

export const organizationRoutes = new Hono<AppEnv>()

organizationRoutes.get('/:organizationId/admins', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner'])) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await listOrganizationAdmins({
    organizationId,
    pagination: getPagination(c.req.query('page'), c.req.query('limit')),
    search: c.req.query('search')?.trim(),
  })

  return c.json(result)
})

organizationRoutes.post('/:organizationId/admins', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner'])) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password =
    typeof body?.password === 'string' && body.password.trim()
      ? body.password
      : null
  const accessMode = body?.accessMode === 'custom' ? 'custom' : 'all'
  const permissions = parseAdminPermissions(body?.permissions)

  if (!name) {
    return c.json({ error: 'Admin name is required.' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Admin email is not valid.' }, 400)
  }

  if (password && password.length < 8) {
    return c.json({ error: 'Admin password must be at least 8 characters.' }, 400)
  }

  if (accessMode === 'custom' && permissions.length === 0) {
    return c.json({ error: 'Choose at least one admin permission.' }, 400)
  }

  try {
    const admin = await createOrganizationAdmin({
      organizationId,
      name,
      email,
      password,
      accessMode,
      permissions,
    })

    return c.json({ admin }, 201)
  } catch (error) {
    if (error instanceof AdminProvisioningError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})

organizationRoutes.get('/:organizationId/students', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner', 'teacher']) && !canReadDashboardResource(membership, 'students')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await listStudents({
    organizationId,
    pagination: getPagination(c.req.query('page'), c.req.query('limit')),
    search: c.req.query('search')?.trim(),
    status: c.req.query('status')?.trim(),
  })

  return c.json(result)
})

organizationRoutes.post('/:organizationId/students', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!canManageDashboardResource(membership, 'students')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : ''
  const nisn = typeof body?.nisn === 'string' && body.nisn.trim() ? body.nisn.trim() : null
  const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null
  const phone = typeof body?.phone === 'string' && body.phone.trim() ? body.phone.trim() : null

  if (!fullName) {
    return c.json({ error: 'Student full name is required.' }, 400)
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Student email is not valid.' }, 400)
  }

  try {
    const student = await createStudent({
      email,
      fullName,
      nisn,
      organizationId,
      phone,
    })

    return c.json({ student }, 201)
  } catch (error) {
    if (error instanceof DirectoryProvisioningError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})

function parseAdminPermissions(value: unknown): AdminDashboardResource[] {
  if (!Array.isArray(value)) return []

  return value.filter((permission): permission is AdminDashboardResource => {
    return typeof permission === 'string' && ADMIN_DASHBOARD_RESOURCES.includes(permission as AdminDashboardResource)
  })
}

organizationRoutes.get('/:organizationId/teachers', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner']) && !canReadDashboardResource(membership, 'teachers')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await listTeachers({
    organizationId,
    pagination: getPagination(c.req.query('page'), c.req.query('limit')),
    search: c.req.query('search')?.trim(),
  })

  return c.json(result)
})

organizationRoutes.post('/:organizationId/teachers', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!canManageDashboardResource(membership, 'teachers')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password =
    typeof body?.password === 'string' && body.password.trim()
      ? body.password
      : null

  if (!name) {
    return c.json({ error: 'Teacher name is required.' }, 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Teacher email is not valid.' }, 400)
  }

  if (password && password.length < 8) {
    return c.json({ error: 'Teacher password must be at least 8 characters.' }, 400)
  }

  try {
    const teacher = await createTeacher({
      email,
      name,
      organizationId,
      password,
    })

    return c.json({ teacher }, 201)
  } catch (error) {
    if (error instanceof DirectoryProvisioningError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})
