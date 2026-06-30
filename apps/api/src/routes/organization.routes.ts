import { Hono } from 'hono'

import { getPagination } from '../lib/pagination.js'
import {
  ClassNotFoundError,
  ClassProvisioningError,
  createClassAnnouncement,
  createOrganizationClass,
  deleteClassAnnouncement,
  deleteOrganizationClass,
  getOrganizationClassDetail,
  listOrganizationClasses,
  updateClassAnnouncement,
  updateOrganizationClass,
} from '../services/organization-class.service.js'
import {
  ADMIN_DASHBOARD_RESOURCES,
  AdminNotFoundError,
  AdminProvisioningError,
  createOrganizationAdmin,
  deleteOrganizationAdmin,
  listOrganizationAdmins,
  updateOrganizationAdminPermissions,
  type AdminDashboardResource,
} from '../services/organization-admin.service.js'
import {
  DirectoryRecordNotFoundError,
  DirectoryProvisioningError,
  createStudent,
  createTeacher,
  deleteStudent,
  deleteTeacher,
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

organizationRoutes.patch('/:organizationId/admins/:adminId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const adminId = c.req.param('adminId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner'])) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const accessMode = body?.accessMode === 'custom' ? 'custom' : 'all'
  const permissions = parseAdminPermissions(body?.permissions)

  if (accessMode === 'custom' && permissions.length === 0) {
    return c.json({ error: 'Choose at least one admin permission.' }, 400)
  }

  try {
    const admin = await updateOrganizationAdminPermissions({
      adminId,
      organizationId,
      accessMode,
      permissions,
    })

    return c.json({ admin })
  } catch (error) {
    if (error instanceof AdminNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.delete('/:organizationId/admins/:adminId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const adminId = c.req.param('adminId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner'])) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    await deleteOrganizationAdmin({
      adminId,
      organizationId,
    })

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof AdminNotFoundError) {
      return c.json({ error: error.message }, 404)
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

  if (
    user.platformRole !== 'platform_admin' &&
    !hasRole(membership, ['owner', 'teacher']) &&
    !canReadDashboardResource(membership, 'students')
  ) {
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

organizationRoutes.delete('/:organizationId/students/:studentId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const studentId = c.req.param('studentId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (user.platformRole !== 'platform_admin' && !canManageDashboardResource(membership, 'students')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    await deleteStudent({
      organizationId,
      studentId,
    })

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof DirectoryRecordNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.get('/:organizationId/classes', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (
    !hasRole(membership, ['owner', 'teacher', 'student']) &&
    !canReadDashboardResource(membership, 'classes')
  ) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (!membership) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await listOrganizationClasses({
    membership,
    pagination: getPagination(c.req.query('page'), c.req.query('limit')),
    search: c.req.query('search')?.trim(),
  })

  return c.json(result)
})

organizationRoutes.get('/:organizationId/classes/:classId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const classId = c.req.param('classId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (
    !hasRole(membership, ['owner', 'teacher', 'student']) &&
    !canReadDashboardResource(membership, 'classes')
  ) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (!membership) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    const schoolClass = await getOrganizationClassDetail({
      classId,
      membership,
    })

    return c.json({ class: schoolClass })
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.post('/:organizationId/classes', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!canManageDashboardResource(membership, 'classes')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const academicYear = typeof body?.academicYear === 'string' ? body.academicYear.trim() : ''
  const capacity = Number(body?.capacity ?? 30)
  const homeroomTeacherId =
    typeof body?.homeroomTeacherId === 'string' && body.homeroomTeacherId.trim()
      ? body.homeroomTeacherId.trim()
      : null

  if (!name) {
    return c.json({ error: 'Class name is required.' }, 400)
  }

  if (!code) {
    return c.json({ error: 'Class code is required.' }, 400)
  }

  if (!academicYear) {
    return c.json({ error: 'Academic year is required.' }, 400)
  }

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
    return c.json({ error: 'Class capacity must be between 1 and 200.' }, 400)
  }

  try {
    const schoolClass = await createOrganizationClass({
      organizationId,
      name,
      code,
      academicYear,
      capacity,
      homeroomTeacherId,
    })

    return c.json({ class: schoolClass }, 201)
  } catch (error) {
    if (error instanceof ClassProvisioningError) {
      return c.json({ error: error.message }, 400)
    }

    throw error
  }
})

organizationRoutes.patch('/:organizationId/classes/:classId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const classId = c.req.param('classId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!canManageDashboardResource(membership, 'classes')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const academicYear = typeof body?.academicYear === 'string' ? body.academicYear.trim() : ''
  const capacity = Number(body?.capacity ?? 30)
  const status = body?.status === 'archived' ? 'archived' : 'active'
  const homeroomTeacherId =
    typeof body?.homeroomTeacherId === 'string' && body.homeroomTeacherId.trim()
      ? body.homeroomTeacherId.trim()
      : null

  if (!name) {
    return c.json({ error: 'Class name is required.' }, 400)
  }

  if (!code) {
    return c.json({ error: 'Class code is required.' }, 400)
  }

  if (!academicYear) {
    return c.json({ error: 'Academic year is required.' }, 400)
  }

  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 200) {
    return c.json({ error: 'Class capacity must be between 1 and 200.' }, 400)
  }

  try {
    const schoolClass = await updateOrganizationClass({
      classId,
      organizationId,
      name,
      code,
      academicYear,
      capacity,
      status,
      homeroomTeacherId,
    })

    return c.json({ class: schoolClass })
  } catch (error) {
    if (error instanceof ClassProvisioningError) {
      return c.json({ error: error.message }, 400)
    }

    if (error instanceof ClassNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.delete('/:organizationId/classes/:classId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const classId = c.req.param('classId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!canManageDashboardResource(membership, 'classes')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    await deleteOrganizationClass({
      classId,
      organizationId,
    })

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.post('/:organizationId/classes/:classId/announcements', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const classId = c.req.param('classId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner', 'teacher']) && !canManageDashboardResource(membership, 'classes')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (!membership) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const announcementBody = typeof body?.body === 'string' ? body.body.trim() : ''

  if (!title) {
    return c.json({ error: 'Announcement title is required.' }, 400)
  }

  if (!announcementBody) {
    return c.json({ error: 'Announcement body is required.' }, 400)
  }

  try {
    const announcement = await createClassAnnouncement({
      body: announcementBody,
      classId,
      membership,
      title,
      userId: user.id,
    })

    return c.json({ announcement }, 201)
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.patch('/:organizationId/classes/:classId/announcements/:announcementId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const classId = c.req.param('classId')
  const announcementId = c.req.param('announcementId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner', 'teacher']) && !canManageDashboardResource(membership, 'classes')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (!membership) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const title = typeof body?.title === 'string' ? body.title.trim() : ''
  const announcementBody = typeof body?.body === 'string' ? body.body.trim() : ''

  if (!title) {
    return c.json({ error: 'Announcement title is required.' }, 400)
  }

  if (!announcementBody) {
    return c.json({ error: 'Announcement body is required.' }, 400)
  }

  try {
    const announcement = await updateClassAnnouncement({
      announcementId,
      body: announcementBody,
      classId,
      membership,
      title,
    })

    return c.json({ announcement })
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})

organizationRoutes.delete('/:organizationId/classes/:classId/announcements/:announcementId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const classId = c.req.param('classId')
  const announcementId = c.req.param('announcementId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!hasRole(membership, ['owner', 'teacher']) && !canManageDashboardResource(membership, 'classes')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  if (!membership) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    await deleteClassAnnouncement({
      announcementId,
      classId,
      membership,
    })

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return c.json({ error: error.message }, 404)
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

  if (
    user.platformRole !== 'platform_admin' &&
    !hasRole(membership, ['owner']) &&
    !canReadDashboardResource(membership, 'teachers')
  ) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const result = await listTeachers({
    organizationId,
    emailStatus: c.req.query('emailStatus')?.trim(),
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

organizationRoutes.delete('/:organizationId/teachers/:teacherId', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const teacherId = c.req.param('teacherId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (user.platformRole !== 'platform_admin' && !canManageDashboardResource(membership, 'teachers')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  try {
    await deleteTeacher({
      organizationId,
      teacherId,
    })

    return c.json({ success: true })
  } catch (error) {
    if (error instanceof DirectoryRecordNotFoundError) {
      return c.json({ error: error.message }, 404)
    }

    throw error
  }
})
