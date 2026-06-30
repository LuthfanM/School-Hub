import { prisma } from '@schoolhub/database'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { organization } from 'better-auth/plugins'

import { ac, admin, owner, student, teacher } from './permissions.js'

const developmentResetPasswordLinks = new Map<string, string>()

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:4000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.WEB_ORIGIN ?? 'http://localhost:3000'],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      developmentResetPasswordLinks.set(user.email.toLowerCase(), url)
      console.log(`[auth] Password reset link for ${user.email}: ${url}`)
    },
  },
  user: {
    additionalFields: {
      platformRole: {
        type: 'string',
        required: false,
        defaultValue: 'user',
        input: false,
      },
    },
  },
  plugins: [
    organization({
      ac,
      creatorRole: 'owner',
      roles: {
        owner,
        admin,
        teacher,
        student,
      },
      schema: {
        organization: {
          additionalFields: {
            description: {
              type: 'string',
              required: false,
              input: true,
            },
            status: {
              type: 'string',
              required: false,
              defaultValue: 'active',
              input: false,
            },
            customDomain: {
              type: 'string',
              required: false,
              input: false,
            },
          },
        },
      },
    }),
  ],
})

export type AuthSession = typeof auth.$Infer.Session

export function getDevelopmentResetPasswordLink(email: string) {
  return developmentResetPasswordLinks.get(email.toLowerCase()) ?? null
}
