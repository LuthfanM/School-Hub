import { z } from 'zod'

export function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Invalid form input.'
}

function optionalTrimmedString() {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return undefined

    const trimmed = value.trim()
    return trimmed || undefined
  }, z.string().optional())
}

function optionalLowercaseEmail(message: string) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return undefined

    const trimmed = value.trim()
    return trimmed ? trimmed.toLowerCase() : undefined
  }, z.string().email(message).optional())
}

function optionalPassword(message: string) {
  return z.preprocess((value) => {
    if (typeof value !== 'string') return undefined

    return value.trim() ? value : undefined
  }, z.string().min(8, message).optional())
}

export const staffLoginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email is not valid.'),
  password: z.string().min(1, 'Password is required.'),
})

export const registerWorkspaceFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.'),
  schoolName: z.string().trim().min(1, 'School name is required.'),
  email: z.string().trim().toLowerCase().email('Email is not valid.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export const studentLoginFormSchema = z.object({
  schoolCode: z.string().trim().toLowerCase().min(1, 'School code is required.'),
  studentId: z.string().trim().min(1, 'Student ID is required.'),
  password: z.string().min(1, 'Password is required.'),
})

export const passwordConfirmationFormSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters.'),
}).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
})

export const createTenantFormSchema = z.object({
  name: z.string().trim().min(1, 'Tenant name is required.'),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only use lowercase letters, numbers, and hyphens.'),
  description: optionalTrimmedString(),
  customDomain: optionalTrimmedString(),
  firstAdminEmail: optionalLowercaseEmail('First admin email is not valid.'),
  firstAdminPassword: optionalPassword('First admin password must be at least 8 characters.'),
})

export const createAdminFormSchema = z.object({
  name: z.string().trim().min(1, 'Admin name is required.'),
  email: z.string().trim().toLowerCase().email('Admin email is not valid.'),
  password: optionalPassword('Admin password must be at least 8 characters.'),
  accessMode: z.enum(['all', 'custom']),
  permissions: z.array(z.string()),
}).refine((value) => value.accessMode !== 'custom' || value.permissions.length > 0, {
  message: 'Choose at least one admin permission.',
  path: ['permissions'],
})

export const createStudentFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Student full name is required.'),
  nisn: optionalTrimmedString(),
  email: optionalLowercaseEmail('Student email is not valid.'),
  phone: optionalTrimmedString(),
})

export const createTeacherFormSchema = z.object({
  name: z.string().trim().min(1, 'Teacher name is required.'),
  email: z.string().trim().toLowerCase().email('Teacher email is not valid.'),
  password: optionalPassword('Teacher password must be at least 8 characters.'),
})

export const classFormSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required.'),
  code: z.string().trim().min(1, 'Class code is required.'),
  academicYear: z.string().trim().min(1, 'Academic year is required.'),
  capacity: z.coerce.number().int('Class capacity must be between 1 and 200.').min(1, 'Class capacity must be between 1 and 200.').max(200, 'Class capacity must be between 1 and 200.'),
  homeroomTeacherId: optionalTrimmedString(),
})

export const classUpdateFormSchema = classFormSchema.extend({
  status: z.enum(['active', 'archived']),
})

export const classAnnouncementFormSchema = z.object({
  title: z.string().trim().min(1, 'Announcement title is required.'),
  body: z.string().trim().min(1, 'Announcement body is required.'),
})
