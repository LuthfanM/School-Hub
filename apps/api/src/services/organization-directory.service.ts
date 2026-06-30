import { randomUUID } from 'node:crypto'

import { prisma, type Prisma } from '@schoolhub/database'

import { auth } from '../auth/index.js'
import { getPaginationMeta, type PaginationInput } from '../lib/pagination.js'

export class DirectoryProvisioningError extends Error {}
export class DirectoryRecordNotFoundError extends Error {}

interface StudentRecord {
  id: string
  fullName: string
  nisn: string | null
  email: string | null
  phone: string | null
  status: string
  createdAt: Date
}

interface TeacherRecord {
  id: string
  role: string
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
  }
}

export async function listStudents({
  organizationId,
  pagination,
  search,
  status,
}: {
  organizationId: string
  pagination: PaginationInput
  search?: string
  status?: string
}) {
  const where: Prisma.StudentWhereInput = {
    organizationId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { nisn: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [students, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        id: true,
        fullName: true,
        nisn: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.student.count({ where }),
  ])

  return {
    data: students.map((student: StudentRecord) => ({
      ...student,
      createdAt: student.createdAt.toISOString(),
    })),
    pagination: getPaginationMeta(pagination.page, pagination.limit, total),
  }
}

export async function createStudent({
  email,
  fullName,
  nisn,
  organizationId,
  phone,
}: {
  email: string | null
  fullName: string
  nisn: string | null
  organizationId: string
  phone: string | null
}) {
  try {
    const student = await prisma.student.create({
      data: {
        organizationId,
        fullName,
        nisn,
        email,
        phone,
      },
      select: {
        id: true,
        fullName: true,
        nisn: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    })

    return {
      ...student,
      createdAt: student.createdAt.toISOString(),
    }
  } catch (error) {
    if (isKnownRequestError(error) && error.code === 'P2002') {
      throw new DirectoryProvisioningError('A student with this NISN already exists in this organization.')
    }

    throw error
  }
}

export async function deleteStudent({
  organizationId,
  studentId,
}: {
  organizationId: string
  studentId: string
}) {
  const result = await prisma.student.deleteMany({
    where: {
      id: studentId,
      organizationId,
    },
  })

  if (result.count === 0) {
    throw new DirectoryRecordNotFoundError('Student was not found in this organization.')
  }
}

export async function listTeachers({
  emailStatus,
  organizationId,
  pagination,
  search,
}: {
  emailStatus?: string
  organizationId: string
  pagination: PaginationInput
  search?: string
}) {
  const userWhere: Prisma.UserWhereInput = {
    ...(emailStatus === 'verified' || emailStatus === 'unverified'
      ? { emailVerified: emailStatus === 'verified' }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
  const where: Prisma.MemberWhereInput = {
    organizationId,
    role: 'teacher',
    ...(Object.keys(userWhere).length > 0 ? { user: userWhere } : {}),
  }

  const [teachers, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
      select: {
        id: true,
        role: true,
        createdAt: true,
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
    data: teachers.map((teacher: TeacherRecord) => ({
      id: teacher.id,
      role: teacher.role,
      createdAt: teacher.createdAt.toISOString(),
      user: teacher.user,
    })),
    pagination: getPaginationMeta(pagination.page, pagination.limit, total),
  }
}

export async function createTeacher({
  email,
  name,
  organizationId,
  password,
}: {
  email: string
  name: string
  organizationId: string
  password: string | null
}) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!existingUser && !password) {
    throw new DirectoryProvisioningError('Password is required when creating a new teacher user locally.')
  }

  if (!existingUser && password) {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    })

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    })
  }

  const teacherUser = await prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  })

  const existingMember = await prisma.member.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: teacherUser.id,
      },
    },
    select: {
      role: true,
    },
  })

  if (existingMember?.role === 'teacher') {
    throw new DirectoryProvisioningError('This person is already a teacher in this school.')
  }

  if (existingMember) {
    throw new DirectoryProvisioningError('This person already has access to this school.')
  }

  const member = await prisma.member.create({
    data: {
      id: randomUUID(),
      organizationId,
      userId: teacherUser.id,
      role: 'teacher',
    },
    select: { id: true },
  })

  const teacher = await prisma.member.findUniqueOrThrow({
    where: { id: member.id },
    select: {
      id: true,
      role: true,
      createdAt: true,
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

  return {
    id: teacher.id,
    role: teacher.role,
    createdAt: teacher.createdAt.toISOString(),
    user: teacher.user,
  }
}

export async function deleteTeacher({
  organizationId,
  teacherId,
}: {
  organizationId: string
  teacherId: string
}) {
  const result = await prisma.member.deleteMany({
    where: {
      id: teacherId,
      organizationId,
      role: 'teacher',
    },
  })

  if (result.count === 0) {
    throw new DirectoryRecordNotFoundError('Teacher was not found in this organization.')
  }
}

function isKnownRequestError(error: unknown): error is { code: string } {
  return Boolean(error && typeof error === 'object' && 'code' in error)
}
