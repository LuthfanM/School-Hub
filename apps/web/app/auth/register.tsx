import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Checkbox } from '@schoolhub/ui/components/checkbox'
import { Input } from '@schoolhub/ui/components/input'
import { authClient } from '../../lib/auth-client'
import { firstValidationMessage, registerWorkspaceFormSchema } from '../../lib/form-validation'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = Route.useNavigate()
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const parsedForm = registerWorkspaceFormSchema.safeParse({
      email,
      fullName,
      password,
      schoolName,
    })
    if (!parsedForm.success) {
      setError(firstValidationMessage(parsedForm.error))
      setIsSubmitting(false)
      return
    }

    const signUpResult = await authClient.signUp.email({
      email: parsedForm.data.email,
      password: parsedForm.data.password,
      name: parsedForm.data.fullName,
      callbackURL: '/dashboard',
    })

    if (signUpResult.error) {
      setError(signUpResult.error.message ?? 'Registration failed')
      setIsSubmitting(false)
      return
    }

    const slug = parsedForm.data.schoolName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const orgResult = await authClient.organization.create({
      name: parsedForm.data.schoolName,
      slug,
    })

    setIsSubmitting(false)

    if (orgResult.error) {
      setError(orgResult.error.message ?? 'Workspace creation failed')
      return
    }

    await navigate({ to: '/dashboard' })
  }

  return (
    <main className="schoolhub-page grid min-h-[100dvh] place-items-center p-4 text-[#15313a]">
      <Card className="w-full max-w-lg rounded-[2rem] border-[#d8e5df] bg-white/92 shadow-[0_24px_70px_rgba(18,52,59,0.10)]">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-[#1d6d54]">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#12343b] text-xs font-bold text-white">SH</span>
            SchoolHub
          </Link>
          <CardTitle className="mt-6 text-3xl text-[#15313a]">Create school workspace</CardTitle>
          <CardDescription className="text-base text-[#526a70]">Create your admin account and first workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
              value={fullName}
            />
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
              onChange={(event) => setSchoolName(event.target.value)}
              placeholder="School name"
              required
              value={schoolName}
            />
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8] sm:col-span-2"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              required
              type="email"
              value={email}
            />
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8] sm:col-span-2"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm text-[#526a70]">
            <Checkbox required />
            I agree to set up this workspace.
          </label>
          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
          <Button className="mt-6 w-full rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[#526a70]">
          Already have an account? <Link to="/auth/login" className="font-semibold text-[#1d6d54]">Login</Link>
        </p>
        </CardContent>
      </Card>
    </main>
  )
}
