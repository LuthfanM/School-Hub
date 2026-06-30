import { useState } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { apiRequest, getApiBaseUrl } from '../../lib/api'
import { getAuthRedirectTarget } from '../../lib/auth-redirect'
import { authClient, signOut } from '../../lib/auth-client'

export const Route = createFileRoute('/auth/login')({
  loader: async () => {
    const redirectTarget = await getAuthRedirectTarget()

    if (redirectTarget === '/dashboard') {
      throw redirect({ to: '/dashboard' })
    }

    if (redirectTarget === '/choose-organization') {
      throw redirect({ to: '/choose-organization' })
    }

    return null
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = Route.useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const blockedMessage = await getLoginContextMessage(email)

    if (blockedMessage) {
      setError(blockedMessage)
      setIsSubmitting(false)
      return
    }

    const { error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      setError(error.message ?? 'Login failed')
      setIsSubmitting(false)
      return
    }

    const session = await apiRequest<{
      user: {
        platformRole?: string | null
      }
      memberships?: Array<{
        organization: {
          status: string
        }
      }>
      hasMultipleActiveMemberships?: boolean
      requiresOrganizationSelection?: boolean
      activeMembership?: {
        organization: {
          status: string
        }
      } | null
    }>('/api/session').catch(() => null)
    const activeMembershipCount = session?.memberships?.filter((membership) => {
      return membership.organization.status === 'active'
    }).length ?? 0

    if (!session?.activeMembership && !session?.requiresOrganizationSelection && session?.user.platformRole !== 'platform_admin') {
      await signOut()
      setError('No active organization workspace is available for this account.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    if (session.requiresOrganizationSelection || session.hasMultipleActiveMemberships || activeMembershipCount > 1) {
      await navigate({ to: '/choose-organization' })
      return
    }

    await navigate({ to: '/dashboard' })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-md rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">SchoolHub</Link>
          <CardTitle className="mt-5 text-3xl">Login</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">Sign in to your school workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@school.edu"
            required
            type="email"
            value={email}
          />
          <Input
            className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[#6F6A62]">
          New school? <Link to="/auth/register" className="font-semibold text-[#2563EB]">Create account</Link>
        </p>
        <p className="mt-3 text-sm text-[#6F6A62]">
          Student account? <Link to="/auth/student-login" className="font-semibold text-[#2563EB]">Login as student</Link>
        </p>
        </CardContent>
      </Card>
    </main>
  )
}

async function getLoginContextMessage(email: string) {
  const params = new URLSearchParams({ email })
  const response = await fetch(`${getApiBaseUrl()}/api/login-context?${params.toString()}`)
    .then((result) => result.ok ? result.json() as Promise<{
      status: 'ok' | 'pending_setup' | 'suspended' | 'unknown'
      organizationName?: string
    }> : null)
    .catch(() => null)

  if (response?.status === 'pending_setup') {
    return `${response.organizationName ?? 'This school'} is still pending setup. The first owner must accept the invitation before this account can log in.`
  }

  if (response?.status === 'suspended') {
    return `${response.organizationName ?? 'This school'} is suspended. Login is blocked until the platform admin reactivates the tenant.`
  }

  return null
}
