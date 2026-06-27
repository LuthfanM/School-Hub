import { prisma, type Prisma } from '@schoolhub/database'

import { getPaginationMeta, type PaginationInput } from '../lib/pagination.js'

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
    data: students.map((student) => ({
      ...student,
      createdAt: student.createdAt.toISOString(),
    })),
    pagination: getPaginationMeta(pagination.page, pagination.limit, total),
  }
}

export async function listTeachers({
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
    role: 'teacher',
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
    data: teachers.map((teacher) => ({
      id: teacher.id,
      role: teacher.role,
      createdAt: teacher.createdAt.toISOString(),
      user: teacher.user,
    })),
    pagination: getPaginationMeta(pagination.page, pagination.limit, total),
  }
}
