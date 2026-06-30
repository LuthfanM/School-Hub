import { prisma, type Prisma } from '@schoolhub/database'

import { getPaginationMeta, type PaginationInput } from '../lib/pagination.js'

export class ClassProvisioningError extends Error {}
export class ClassNotFoundError extends Error {}

export interface ClassMembershipScope {
  id: string
  role: string
  organizationId: string
}

export interface CreateClassInput {
  organizationId: string
  name: string
  code: string
  academicYear: string
  capacity: number
  homeroomTeacherId: string | null
  announcement: string | null
}

export interface UpdateClassInput extends CreateClassInput {
  classId: string
  status: string
}

export async function listOrganizationClasses({
  membership,
  pagination,
  search,
}: {
  membership: ClassMembershipScope
  pagination: PaginationInput
  search?: string
}) {
  const where = await getClassVisibilityWhere(membership)

  const filteredWhere: Prisma.SchoolClassWhereInput = {
    ...where,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { academicYear: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [classes, total] = await prisma.$transaction([
    prisma.schoolClass.findMany({
      where: filteredWhere,
      orderBy: [{ status: 'asc' }, { academicYear: 'desc' }, { name: 'asc' }],
      skip: pagination.skip,
      take: pagination.limit,
      select: classSummarySelect,
    }),
    prisma.schoolClass.count({ where: filteredWhere }),
  ])

  return {
    data: classes.map(serializeClassSummary),
    pagination: getPaginationMeta(pagination.page, pagination.limit, total),
  }
}

export async function getOrganizationClassDetail({
  classId,
  membership,
}: {
  classId: string
  membership: ClassMembershipScope
}) {
  const where = await getClassVisibilityWhere(membership)

  const schoolClass = await prisma.schoolClass.findFirst({
    where: {
      ...where,
      id: classId,
    },
    select: {
      ...classSummarySelect,
      announcement: true,
      averageScore: true,
      students: {
        orderBy: { student: { fullName: 'asc' } },
        select: {
          id: true,
          status: true,
          student: {
            select: {
              id: true,
              fullName: true,
              nisn: true,
              email: true,
              status: true,
            },
          },
        },
      },
      subjects: {
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }, { subjectName: 'asc' }],
        select: {
          id: true,
          subjectName: true,
          room: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          teacherMember: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!schoolClass) {
    throw new ClassNotFoundError('Class was not found in this organization.')
  }

  return {
    ...serializeClassSummary(schoolClass),
    announcement: schoolClass.announcement,
    averageScore: schoolClass.averageScore,
    roster: schoolClass.students.map((classStudent) => ({
      id: classStudent.id,
      status: classStudent.status,
      attendanceToday: 'not_recorded',
      student: classStudent.student,
    })),
    subjects: schoolClass.subjects.map((subject) => ({
      id: subject.id,
      subjectName: subject.subjectName,
      room: subject.room,
      dayOfWeek: subject.dayOfWeek,
      startTime: subject.startTime,
      endTime: subject.endTime,
      teacher: subject.teacherMember
        ? {
            id: subject.teacherMember.id,
            name: subject.teacherMember.user.name,
            email: subject.teacherMember.user.email,
          }
        : null,
    })),
  }
}

export async function createOrganizationClass(input: CreateClassInput) {
  if (input.homeroomTeacherId) {
    const teacher = await prisma.member.findFirst({
      where: {
        id: input.homeroomTeacherId,
        organizationId: input.organizationId,
        role: 'teacher',
      },
      select: { id: true },
    })

    if (!teacher) {
      throw new ClassProvisioningError('Homeroom teacher was not found in this organization.')
    }
  }

  try {
    const schoolClass = await prisma.schoolClass.create({
      data: input,
      select: classSummarySelect,
    })

    return serializeClassSummary(schoolClass)
  } catch (error) {
    if (isKnownRequestError(error) && error.code === 'P2002') {
      throw new ClassProvisioningError('A class with this code already exists for this academic year.')
    }

    throw error
  }
}

export async function updateOrganizationClass(input: UpdateClassInput) {
  await assertTeacherBelongsToOrganization(input.organizationId, input.homeroomTeacherId)

  try {
    const schoolClass = await prisma.schoolClass.update({
      where: {
        id: input.classId,
        organizationId: input.organizationId,
      },
      data: {
        name: input.name,
        code: input.code,
        academicYear: input.academicYear,
        capacity: input.capacity,
        status: input.status,
        homeroomTeacherId: input.homeroomTeacherId,
        announcement: input.announcement,
      },
      select: classSummarySelect,
    })

    return serializeClassSummary(schoolClass)
  } catch (error) {
    if (isKnownRequestError(error) && error.code === 'P2002') {
      throw new ClassProvisioningError('A class with this code already exists for this academic year.')
    }

    if (isKnownRequestError(error) && error.code === 'P2025') {
      throw new ClassNotFoundError('Class was not found in this organization.')
    }

    throw error
  }
}

export async function deleteOrganizationClass({
  classId,
  organizationId,
}: {
  classId: string
  organizationId: string
}) {
  try {
    await prisma.schoolClass.delete({
      where: {
        id: classId,
        organizationId,
      },
    })
  } catch (error) {
    if (isKnownRequestError(error) && error.code === 'P2025') {
      throw new ClassNotFoundError('Class was not found in this organization.')
    }

    throw error
  }
}

async function assertTeacherBelongsToOrganization(organizationId: string, teacherMemberId: string | null) {
  if (!teacherMemberId) return

  const teacher = await prisma.member.findFirst({
    where: {
      id: teacherMemberId,
      organizationId,
      role: 'teacher',
    },
    select: { id: true },
  })

  if (!teacher) {
    throw new ClassProvisioningError('Homeroom teacher was not found in this organization.')
  }
}

async function getClassVisibilityWhere(membership: ClassMembershipScope): Promise<Prisma.SchoolClassWhereInput> {
  const baseWhere: Prisma.SchoolClassWhereInput = {
    organizationId: membership.organizationId,
  }

  if (membership.role === 'owner' || membership.role === 'admin') {
    return baseWhere
  }

  if (membership.role === 'teacher') {
    return {
      ...baseWhere,
      OR: [
        { homeroomTeacherId: membership.id },
        { subjects: { some: { teacherMemberId: membership.id } } },
      ],
    }
  }

  if (membership.role === 'student') {
    const student = await prisma.student.findFirst({
      where: {
        organizationId: membership.organizationId,
        userId: {
          not: null,
        },
        user: {
          organizationMembers: {
            some: {
              id: membership.id,
            },
          },
        },
      },
      select: { id: true },
    })

    return {
      ...baseWhere,
      students: {
        some: {
          studentId: student?.id ?? '__no_student_record__',
          status: 'active',
        },
      },
    }
  }

  return {
    ...baseWhere,
    id: '__no_class_access__',
  }
}

const classSummarySelect = {
  id: true,
  name: true,
  code: true,
  academicYear: true,
  capacity: true,
  status: true,
  createdAt: true,
  homeroomTeacher: {
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      students: {
        where: { status: 'active' },
      },
      subjects: true,
    },
  },
} satisfies Prisma.SchoolClassSelect

function serializeClassSummary(schoolClass: Prisma.SchoolClassGetPayload<{ select: typeof classSummarySelect }>) {
  return {
    id: schoolClass.id,
    name: schoolClass.name,
    code: schoolClass.code,
    academicYear: schoolClass.academicYear,
    capacity: schoolClass.capacity,
    status: schoolClass.status,
    createdAt: schoolClass.createdAt.toISOString(),
    studentCount: schoolClass._count.students,
    subjectCount: schoolClass._count.subjects,
    homeroomTeacher: schoolClass.homeroomTeacher
      ? {
          id: schoolClass.homeroomTeacher.id,
          name: schoolClass.homeroomTeacher.user.name,
          email: schoolClass.homeroomTeacher.user.email,
        }
      : null,
  }
}

function isKnownRequestError(error: unknown): error is { code: string } {
  return Boolean(error && typeof error === 'object' && 'code' in error)
}
