import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Checkbox } from '@schoolhub/ui/components/checkbox'
import { Input } from '@schoolhub/ui/components/input'
import { authClient } from '../../lib/auth-client'

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

    const signUpResult = await authClient.signUp.email({
      email,
      password,
      name: fullName,
      callbackURL: '/dashboard',
    })

    if (signUpResult.error) {
      setError(signUpResult.error.message ?? 'Registration failed')
      setIsSubmitting(false)
      return
    }

    const slug = schoolName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const orgResult = await authClient.organization.create({
      name: schoolName,
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
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-lg rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">SchoolHub</Link>
          <CardTitle className="mt-5 text-3xl">Create school workspace</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">Create your admin account and first workspace.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              required
              value={fullName}
            />
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
              onChange={(event) => setSchoolName(event.target.value)}
              placeholder="School name"
              required
              value={schoolName}
            />
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE] sm:col-span-2"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              required
              type="email"
              value={email}
            />
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE] sm:col-span-2"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
              type="password"
              value={password}
            />
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm text-[#6F6A62]">
            <Checkbox required />
            I agree to set up this workspace.
          </label>
          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
          <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating...' : 'Create Workspace'}
          </Button>
        </form>
        <p className="mt-6 text-sm text-[#6F6A62]">
          Already have an account? <Link to="/auth/login" className="font-semibold text-[#2563EB]">Login</Link>
        </p>
        </CardContent>
      </Card>
    </main>
  )
}
