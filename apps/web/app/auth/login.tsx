import { useState } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { apiRequest, getApiBaseUrl } from '../../lib/api'
import { getAuthRedirectTarget } from '../../lib/auth-redirect'
import { authClient, signOut } from '../../lib/auth-client'
import { firstValidationMessage, staffLoginFormSchema } from '../../lib/form-validation'

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

    const parsedForm = staffLoginFormSchema.safeParse({ email, password })
    if (!parsedForm.success) {
      setError(firstValidationMessage(parsedForm.error))
      setIsSubmitting(false)
      return
    }

    const blockedMessage = await getLoginContextMessage(parsedForm.data.email)

    if (blockedMessage) {
      setError(blockedMessage)
      setIsSubmitting(false)
      return
    }

    const { error } = await authClient.signIn.email({
      email: parsedForm.data.email,
      password: parsedForm.data.password,
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
    <main className="schoolhub-page grid min-h-[100dvh] place-items-center p-4 text-[#15313a]">
      <Card className="w-full max-w-md rounded-[2rem] border-[#d8e5df] bg-white/92 shadow-[0_24px_70px_rgba(18,52,59,0.10)]">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-[#1d6d54]">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#12343b] text-xs font-bold text-white">SH</span>
            SchoolHub
          </Link>
          <CardTitle className="mt-6 text-3xl text-[#15313a]">Login</CardTitle>
          <CardDescription className="text-base text-[#526a70]">Sign in to your school workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@school.edu"
            required
            type="email"
            value={email}
          />
          <Input
            className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <Button className="w-full rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[#526a70]">
          New school? <Link to="/auth/register" className="font-semibold text-[#1d6d54]">Create account</Link>
        </p>
        <p className="mt-3 text-sm text-[#526a70]">
          Student account? <Link to="/auth/student-login" className="font-semibold text-[#1d6d54]">Login as student</Link>
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
