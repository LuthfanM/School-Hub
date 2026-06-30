import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { prisma } from '@schoolhub/database'

export const STUDENT_SESSION_COOKIE = 'schoolhub.student_session'

const failedLoginLimit = 5
const lockoutMs = 15 * 60 * 1000
const sessionTtlMs = 7 * 24 * 60 * 60 * 1000

export class StudentAuthError extends Error {}

export function generateTemporaryStudentPassword() {
  return `${randomChunk()}-${randomChunk()}`
}

export async function createStudentCredential({
  organizationId,
  password,
  studentId,
  username,
}: {
  organizationId: string
  password?: string
  studentId: string
  username?: string
}) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      organizationId,
    },
    select: {
      id: true,
      nisn: true,
    },
  })

  if (!student) {
    throw new StudentAuthError('Student was not found in this organization.')
  }

  const credentialUsername = (username?.trim() || student.nisn || '').trim()

  if (!credentialUsername) {
    throw new StudentAuthError('Student needs a NIS/NISN before login can be created.')
  }

  const temporaryPassword = password ?? generateTemporaryStudentPassword()

  if (temporaryPassword.length < 8) {
    throw new StudentAuthError('Student password must be at least 8 characters.')
  }

  await prisma.studentCredential.upsert({
    where: { studentId: student.id },
    create: {
      organizationId,
      passwordHash: hashStudentPassword(temporaryPassword),
      studentId: student.id,
      username: credentialUsername,
    },
    update: {
      failedLoginCount: 0,
      lockedUntil: null,
      mustChangePassword: true,
      passwordHash: hashStudentPassword(temporaryPassword),
      username: credentialUsername,
    },
  })

  return {
    temporaryPassword,
    username: credentialUsername,
  }
}

export async function loginStudent({
  password,
  schoolCode,
  studentId,
}: {
  password: string
  schoolCode: string
  studentId: string
}) {
  const invalidMessage = 'Student credentials are invalid.'
  const organization = await prisma.organization.findUnique({
    where: { slug: schoolCode },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  })

  if (!organization || organization.status !== 'active') {
    throw new StudentAuthError(invalidMessage)
  }

  const credential = await prisma.studentCredential.findUnique({
    where: {
      organizationId_username: {
        organizationId: organization.id,
        username: studentId,
      },
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          nisn: true,
          status: true,
        },
      },
    },
  })

  if (!credential) {
    throw new StudentAuthError(invalidMessage)
  }

  if (credential.lockedUntil && credential.lockedUntil > new Date()) {
    throw new StudentAuthError('Student login is temporarily locked. Try again later.')
  }

  if (!verifyStudentPassword(password, credential.passwordHash)) {
    const failedLoginCount = credential.failedLoginCount + 1
    await prisma.studentCredential.update({
      where: { id: credential.id },
      data: {
        failedLoginCount,
        lockedUntil: failedLoginCount >= failedLoginLimit ? new Date(Date.now() + lockoutMs) : null,
      },
    })
    throw new StudentAuthError(invalidMessage)
  }

  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + sessionTtlMs)

  await prisma.$transaction([
    prisma.studentCredential.update({
      where: { id: credential.id },
      data: {
        failedLoginCount: 0,
        lastLoginAt: new Date(),
        lockedUntil: null,
      },
    }),
    prisma.studentSession.create({
      data: {
        expiresAt,
        organizationId: organization.id,
        studentId: credential.studentId,
        token,
      },
    }),
  ])

  return {
    expiresAt,
    mustChangePassword: credential.mustChangePassword,
    organization,
    student: credential.student,
    token,
  }
}

export async function getStudentSession(token: string | undefined) {
  if (!token) return null

  const session = await prisma.studentSession.findUnique({
    where: { token },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
      student: {
        select: {
          id: true,
          fullName: true,
          nisn: true,
          status: true,
          credential: {
            select: {
              mustChangePassword: true,
            },
          },
        },
      },
    },
  })

  if (!session || session.expiresAt <= new Date() || session.organization.status !== 'active') {
    if (session) {
      await prisma.studentSession.delete({ where: { id: session.id } }).catch(() => null)
    }
    return null
  }

  return session
}

export async function changeStudentPassword({
  newPassword,
  studentId,
}: {
  newPassword: string
  studentId: string
}) {
  if (newPassword.length < 8) {
    throw new StudentAuthError('Student password must be at least 8 characters.')
  }

  await prisma.studentCredential.update({
    where: { studentId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      mustChangePassword: false,
      passwordHash: hashStudentPassword(newPassword),
    },
  })
}

export async function logoutStudent(token: string | undefined) {
  if (!token) return

  await prisma.studentSession.deleteMany({
    where: { token },
  })
}

function hashStudentPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')

  return `scrypt$${salt}$${hash}`
}

function verifyStudentPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split('$')

  if (algorithm !== 'scrypt' || !salt || !hash) return false

  const candidate = scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')

  return expected.length === candidate.length && timingSafeEqual(expected, candidate)
}

function randomChunk() {
  return randomBytes(3).toString('base64url').toUpperCase()
}
