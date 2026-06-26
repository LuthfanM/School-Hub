import 'dotenv/config'

import { prisma } from '@schoolhub/database'

import { auth } from '../auth/index.js'

const name = process.env.SEED_ADMIN_NAME ?? 'Platform Admin'
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

if (!email || !password) {
  console.error(
    'Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD. Example: SEED_ADMIN_EMAIL=admin@example.com SEED_ADMIN_PASSWORD=change-me npm run seed:platform-admin -w @schoolhub/api'
  )
  process.exit(1)
}

if (password.length < 8) {
  console.error('SEED_ADMIN_PASSWORD must be at least 8 characters.')
  process.exit(1)
}

const existingUser = await prisma.user.findUnique({
  where: { email },
})

if (!existingUser) {
  await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  })
}

const admin = await prisma.user.update({
  where: { email },
  data: {
    name,
    platformRole: 'platform_admin',
    emailVerified: true,
  },
  select: {
    id: true,
    name: true,
    email: true,
    platformRole: true,
  },
})

console.log(`Seeded platform admin: ${admin.email} (${admin.id})`)

await prisma.$disconnect()
