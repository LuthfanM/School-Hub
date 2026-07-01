import { Hono } from 'hono'
import { z } from 'zod'

import { getPagination } from '../lib/pagination.js'
import { firstValidationMessage, optionalLowercaseEmail, optionalPassword, optionalTrimmedString } from '../lib/validation.js'
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
  createStudentCredential,
  StudentAuthError,
} from '../services/student-auth.service.js'
import {
  canManageDashboardResource,
  canReadDashboardResource,
  getOrganizationMembership,
  hasRole,
} from '../services/membership.service.js'
import type { AppEnv } from '../types/app-env.js'

export const organizationRoutes = new Hono<AppEnv>()

const adminFormSchema = z.object({
  name: z.string().trim().min(1, 'Admin name is required.'),
  email: z.string().trim().toLowerCase().email('Admin email is not valid.'),
  password: optionalPassword('Admin password must be at least 8 characters.'),
  accessMode: z.enum(['all', 'custom']).catch('all'),
  permissions: z.unknown().transform(parseAdminPermissions),
}).refine((value) => value.accessMode !== 'custom' || value.permissions.length > 0, {
  message: 'Choose at least one admin permission.',
  path: ['permissions'],
})

const adminPermissionUpdateSchema = z.object({
  accessMode: z.enum(['all', 'custom']).catch('all'),
  permissions: z.unknown().transform(parseAdminPermissions),
}).refine((value) => value.accessMode !== 'custom' || value.permissions.length > 0, {
  message: 'Choose at least one admin permission.',
  path: ['permissions'],
})

const studentFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Student full name is required.'),
  nisn: optionalTrimmedString(),
  email: optionalLowercaseEmail('Student email is not valid.'),
  phone: optionalTrimmedString(),
})

const studentCredentialSchema = z.object({
  username: z.preprocess((value) => {
    if (typeof value !== 'string') return undefined

    const trimmed = value.trim()
    return trimmed || undefined
  }, z.string().optional()),
})

const classFormSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required.'),
  code: z.string().trim().min(1, 'Class code is required.'),
  academicYear: z.string().trim().min(1, 'Academic year is required.'),
  capacity: z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return 30
    return value
  }, z.coerce.number().int('Class capacity must be between 1 and 200.').min(1, 'Class capacity must be between 1 and 200.').max(200, 'Class capacity must be between 1 and 200.')),
  homeroomTeacherId: optionalTrimmedString(),
})

const classUpdateSchema = classFormSchema.extend({
  status: z.enum(['active', 'archived']).catch('active'),
})

const classAnnouncementSchema = z.object({
  title: z.string().trim().min(1, 'Announcement title is required.'),
  body: z.string().trim().min(1, 'Announcement body is required.'),
})

const teacherFormSchema = z.object({
  name: z.string().trim().min(1, 'Teacher name is required.'),
  email: z.string().trim().toLowerCase().email('Teacher email is not valid.'),
  password: optionalPassword('Teacher password must be at least 8 characters.'),
})

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
  const parsedBody = adminFormSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const admin = await createOrganizationAdmin({
      organizationId,
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      password: parsedBody.data.password,
      accessMode: parsedBody.data.accessMode,
      permissions: parsedBody.data.permissions,
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
  const parsedBody = adminPermissionUpdateSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const admin = await updateOrganizationAdminPermissions({
      adminId,
      organizationId,
      accessMode: parsedBody.data.accessMode,
      permissions: parsedBody.data.permissions,
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
  const parsedBody = studentFormSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const student = await createStudent({
      email: parsedBody.data.email,
      fullName: parsedBody.data.fullName,
      nisn: parsedBody.data.nisn,
      organizationId,
      phone: parsedBody.data.phone,
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

  if (!canManageDashboardResource(membership, 'students')) {
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

organizationRoutes.post('/:organizationId/students/:studentId/credential', async (c) => {
  const user = c.get('user')
  const organizationId = c.req.param('organizationId')
  const studentId = c.req.param('studentId')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const membership = await getOrganizationMembership(user.id, organizationId)

  if (!canManageDashboardResource(membership, 'students')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const body = await c.req.json().catch(() => null)
  const parsedBody = studentCredentialSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const credential = await createStudentCredential({
      organizationId,
      studentId,
      username: parsedBody.data.username,
    })

    return c.json({ credential })
  } catch (error) {
    if (error instanceof StudentAuthError) {
      return c.json({ error: error.message }, 400)
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
  const parsedBody = classFormSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const schoolClass = await createOrganizationClass({
      organizationId,
      name: parsedBody.data.name,
      code: parsedBody.data.code,
      academicYear: parsedBody.data.academicYear,
      capacity: parsedBody.data.capacity,
      homeroomTeacherId: parsedBody.data.homeroomTeacherId,
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
  const parsedBody = classUpdateSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const schoolClass = await updateOrganizationClass({
      classId,
      organizationId,
      name: parsedBody.data.name,
      code: parsedBody.data.code,
      academicYear: parsedBody.data.academicYear,
      capacity: parsedBody.data.capacity,
      status: parsedBody.data.status,
      homeroomTeacherId: parsedBody.data.homeroomTeacherId,
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
  const parsedBody = classAnnouncementSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const announcement = await createClassAnnouncement({
      body: parsedBody.data.body,
      classId,
      membership,
      title: parsedBody.data.title,
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
  const parsedBody = classAnnouncementSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const announcement = await updateClassAnnouncement({
      announcementId,
      body: parsedBody.data.body,
      classId,
      membership,
      title: parsedBody.data.title,
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
  const parsedBody = teacherFormSchema.safeParse(body)
  if (!parsedBody.success) {
    return c.json({ error: firstValidationMessage(parsedBody.error) }, 400)
  }

  try {
    const teacher = await createTeacher({
      email: parsedBody.data.email,
      name: parsedBody.data.name,
      organizationId,
      password: parsedBody.data.password,
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

  if (!canManageDashboardResource(membership, 'teachers')) {
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
