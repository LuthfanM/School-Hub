import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { authClient } from '../../lib/auth-client'

export const Route = createFileRoute('/auth/login')({
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

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/dashboard',
    })

    setIsSubmitting(false)

    if (error) {
      setError(error.message ?? 'Login failed')
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
        </CardContent>
      </Card>
    </main>
  )
}
