import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  plugins: [organizationClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient
