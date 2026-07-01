import 'dotenv/config'

import { randomUUID } from 'node:crypto'

import { prisma } from '@schoolhub/database'

import { auth } from '../auth/index.js'
import { createStudentCredential } from '../services/student-auth.service.js'

type SeedUser = {
  email: string
  name: string
}

type SeedStudent = {
  classCode: string
  email: string
  fullName: string
  nisn: string
  phone: string
}

type SeedClass = {
  academicYear: string
  capacity: number
  code: string
  name: string
  subjects: Array<{
    dayOfWeek: string
    endTime: string
    room: string
    startTime: string
    subjectName: string
    teacherIndex: number
  }>
}

const staffPassword = process.env.SEED_TENANT_DATA_STAFF_PASSWORD ?? 'SchoolHub123!'
const studentPassword = process.env.SEED_TENANT_DATA_STUDENT_PASSWORD ?? 'Student123!'
const targetStatuses = ['active', 'suspended']

if (staffPassword.length < 8) {
  console.error('SEED_TENANT_DATA_STAFF_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

if (studentPassword.length < 8) {
  console.error('SEED_TENANT_DATA_STUDENT_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

const tenants = await prisma.organization.findMany({
  where: {
    status: {
      in: targetStatuses,
    },
  },
  orderBy: {
    slug: 'asc',
  },
  select: {
    id: true,
    name: true,
    slug: true,
    status: true,
  },
})

if (tenants.length === 0) {
  console.error('No active or suspended tenants found. Run npm run seed:platform-tenants first.')
  process.exit(1)
}

for (const tenant of tenants) {
  const seed = buildTenantSeed(tenant.slug)
  const admins = await Promise.all(seed.admins.map((admin) => ensureMember({
    organizationId: tenant.id,
    role: 'admin',
    user: admin,
  })))
  const teachers = await Promise.all(seed.teachers.map((teacher) => ensureMember({
    organizationId: tenant.id,
    role: 'teacher',
    user: teacher,
  })))
  const classes = []

  for (const [index, seedClass] of seed.classes.entries()) {
    const homeroomTeacher = teachers[index % teachers.length]
    const schoolClass = await prisma.schoolClass.upsert({
      where: {
        organizationId_code_academicYear: {
          academicYear: seedClass.academicYear,
          code: seedClass.code,
          organizationId: tenant.id,
        },
      },
      create: {
        academicYear: seedClass.academicYear,
        averageScore: 80 + index * 4,
        capacity: seedClass.capacity,
        code: seedClass.code,
        homeroomTeacherId: homeroomTeacher.id,
        name: seedClass.name,
        organizationId: tenant.id,
        status: 'active',
      },
      update: {
        averageScore: 80 + index * 4,
        capacity: seedClass.capacity,
        homeroomTeacherId: homeroomTeacher.id,
        name: seedClass.name,
        status: 'active',
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    })

    for (const subject of seedClass.subjects) {
      const teacher = teachers[subject.teacherIndex % teachers.length]
      const existingSubject = await prisma.classSubject.findFirst({
        where: {
          classId: schoolClass.id,
          subjectName: subject.subjectName,
        },
        select: {
          id: true,
        },
      })

      if (existingSubject) {
        await prisma.classSubject.update({
          where: { id: existingSubject.id },
          data: {
            dayOfWeek: subject.dayOfWeek,
            endTime: subject.endTime,
            room: subject.room,
            startTime: subject.startTime,
            teacherMemberId: teacher.id,
          },
        })
      } else {
        await prisma.classSubject.create({
          data: {
            classId: schoolClass.id,
            dayOfWeek: subject.dayOfWeek,
            endTime: subject.endTime,
            room: subject.room,
            startTime: subject.startTime,
            subjectName: subject.subjectName,
            teacherMemberId: teacher.id,
          },
        })
      }
    }

    classes.push(schoolClass)
  }

  for (const studentSeed of seed.students) {
    const student = await prisma.student.upsert({
      where: {
        organizationId_nisn: {
          nisn: studentSeed.nisn,
          organizationId: tenant.id,
        },
      },
      create: {
        email: studentSeed.email,
        fullName: studentSeed.fullName,
        nisn: studentSeed.nisn,
        organizationId: tenant.id,
        phone: studentSeed.phone,
        status: 'active',
      },
      update: {
        email: studentSeed.email,
        fullName: studentSeed.fullName,
        phone: studentSeed.phone,
        status: 'active',
      },
      select: {
        id: true,
      },
    })
    const schoolClass = classes.find((candidate) => candidate.code === studentSeed.classCode)

    if (schoolClass) {
      await prisma.classStudent.upsert({
        where: {
          classId_studentId: {
            classId: schoolClass.id,
            studentId: student.id,
          },
        },
        create: {
          classId: schoolClass.id,
          studentId: student.id,
          status: 'active',
        },
        update: {
          status: 'active',
        },
      })
    }

    await createStudentCredential({
      organizationId: tenant.id,
      password: studentPassword,
      studentId: student.id,
      username: studentSeed.nisn,
    })
  }

  for (const schoolClass of classes) {
    const existingAnnouncement = await prisma.classAnnouncement.findFirst({
      where: {
        classId: schoolClass.id,
        title: 'Welcome to the new academic week',
      },
      select: {
        id: true,
      },
    })

    const announcementData = {
      body: `Please check the timetable and attendance roster for ${schoolClass.name}.`,
      createdBy: admins[0].userId,
      title: 'Welcome to the new academic week',
    }

    if (existingAnnouncement) {
      await prisma.classAnnouncement.update({
        where: { id: existingAnnouncement.id },
        data: announcementData,
      })
    } else {
      await prisma.classAnnouncement.create({
        data: {
          ...announcementData,
          classId: schoolClass.id,
        },
      })
    }
  }

  console.log(
    `Seeded ${tenant.name} (${tenant.status}): ${admins.length} admins, ${teachers.length} teachers, ${seed.students.length} students, ${classes.length} classes`
  )
}

console.log(`Tenant data seed complete. Staff password: ${staffPassword}. Student password: ${studentPassword}.`)

await prisma.$disconnect()

async function ensureMember({
  organizationId,
  role,
  user,
}: {
  organizationId: string
  role: 'admin' | 'teacher'
  user: SeedUser
}) {
  await ensureUser(user)

  const existingUser = await prisma.user.findUniqueOrThrow({
    where: { email: user.email },
    select: { id: true },
  })

  const member = await prisma.member.upsert({
    where: {
      organizationId_userId: {
        organizationId,
        userId: existingUser.id,
      },
    },
    create: {
      id: randomUUID(),
      organizationId,
      role,
      userId: existingUser.id,
    },
    update: {
      role,
    },
    select: {
      id: true,
      userId: true,
    },
  })

  if (role === 'admin') {
    await prisma.memberPermission.upsert({
      where: {
        memberId_resource_action: {
          action: 'access-all',
          memberId: member.id,
          resource: 'dashboard',
        },
      },
      create: {
        action: 'access-all',
        memberId: member.id,
        resource: 'dashboard',
      },
      update: {},
    })
  }

  return member
}

async function ensureUser(user: SeedUser) {
  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  })

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        email: user.email,
        name: user.name,
        password: staffPassword,
      },
    })
  }

  await prisma.user.update({
    where: { email: user.email },
    data: {
      emailVerified: true,
      name: user.name,
    },
  })
}

function buildTenantSeed(slug: string) {
  const emailDomain = `${slug}.seed.schoolhub.local`
  const prefix = slug
    .split('-')
    .map((part) => part.slice(0, 3))
    .join('')
    .slice(0, 8)
  const tenantNumber = numericHash(slug)
  const classes: SeedClass[] = [
    {
      academicYear: '2026/2027',
      capacity: 30,
      code: '10-A',
      name: 'Class 10-A',
      subjects: [
        { dayOfWeek: 'Monday', endTime: '08:40', room: 'Room 10A', startTime: '07:30', subjectName: 'Mathematics', teacherIndex: 0 },
        { dayOfWeek: 'Tuesday', endTime: '10:10', room: 'Room 10A', startTime: '09:00', subjectName: 'English', teacherIndex: 1 },
        { dayOfWeek: 'Thursday', endTime: '11:40', room: 'Lab 1', startTime: '10:30', subjectName: 'Science', teacherIndex: 2 },
      ],
    },
    {
      academicYear: '2026/2027',
      capacity: 30,
      code: '11-B',
      name: 'Class 11-B',
      subjects: [
        { dayOfWeek: 'Monday', endTime: '10:10', room: 'Room 11B', startTime: '09:00', subjectName: 'Physics', teacherIndex: 2 },
        { dayOfWeek: 'Wednesday', endTime: '09:20', room: 'Room 11B', startTime: '08:10', subjectName: 'Indonesian', teacherIndex: 3 },
        { dayOfWeek: 'Friday', endTime: '11:40', room: 'Room 11B', startTime: '10:30', subjectName: 'History', teacherIndex: 1 },
      ],
    },
    {
      academicYear: '2026/2027',
      capacity: 30,
      code: '12-SCI',
      name: 'Grade 12 Science',
      subjects: [
        { dayOfWeek: 'Tuesday', endTime: '08:40', room: 'Lab 2', startTime: '07:30', subjectName: 'Chemistry', teacherIndex: 2 },
        { dayOfWeek: 'Wednesday', endTime: '11:40', room: 'Room 12S', startTime: '10:30', subjectName: 'Biology', teacherIndex: 0 },
        { dayOfWeek: 'Thursday', endTime: '10:10', room: 'Room 12S', startTime: '09:00', subjectName: 'English', teacherIndex: 1 },
      ],
    },
  ]

  return {
    admins: [
      { email: `admin.one@${emailDomain}`, name: `Admin ${titleCase(slug)} One` },
      { email: `admin.two@${emailDomain}`, name: `Admin ${titleCase(slug)} Two` },
    ],
    classes,
    students: buildStudents({
      classes,
      emailDomain,
      prefix,
      tenantNumber,
    }),
    teachers: [
      { email: `teacher.math@${emailDomain}`, name: 'Budi Santoso' },
      { email: `teacher.english@${emailDomain}`, name: 'Siti Maharani' },
      { email: `teacher.science@${emailDomain}`, name: 'Raka Wijaya' },
      { email: `teacher.humanities@${emailDomain}`, name: 'Dewi Lestari' },
    ],
  }
}

function buildStudents({
  classes,
  emailDomain,
  prefix,
  tenantNumber,
}: {
  classes: SeedClass[]
  emailDomain: string
  prefix: string
  tenantNumber: number
}): SeedStudent[] {
  const names = [
    'Alya Putri',
    'Raka Pratama',
    'Nadia Safira',
    'Bagas Mahendra',
    'Citra Anindya',
    'Dimas Saputra',
    'Farah Nabila',
    'Gilang Ramadhan',
    'Hana Puspita',
    'Iqbal Maulana',
    'Jasmine Aulia',
    'Kevin Ardian',
    'Laras Ayuning',
    'Mikael Jonathan',
    'Naufal Hakim',
    'Olivia Kartika',
    'Pramudya Arif',
    'Qaira Zahra',
    'Rizky Aditya',
    'Salma Kirana',
    'Tegar Wicaksono',
    'Umaira Safitri',
    'Vino Mahesa',
    'Wulan Sari',
    'Yasmin Amalia',
    'Zidan Fadillah',
    'Anisa Rahma',
    'Bayu Nugroho',
    'Clara Maharani',
    'Daffa Alfarizi',
  ]

  return names.map((fullName, index) => {
    const sequence = String(index + 1).padStart(3, '0')
    const classCode = classes[index % classes.length].code
    const normalizedName = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '.')

    return {
      classCode,
      email: `${normalizedName}.${prefix}@${emailDomain}`,
      fullName,
      nisn: `${tenantNumber}${sequence}`,
      phone: `+62812${String(tenantNumber).padStart(4, '0')}${String(index + 11).padStart(2, '0')}`,
    }
  })
}

function numericHash(value: string) {
  const total = value.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return 1000 + (total % 8000)
}

function titleCase(value: string) {
  return value
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ')
}
