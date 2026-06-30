import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { apiRequest } from '../../lib/api'

export const Route = createFileRoute('/auth/student-login')({
  component: StudentLoginPage,
})

function StudentLoginPage() {
  const navigate = Route.useNavigate()
  const [schoolCode, setSchoolCode] = useState('')
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await apiRequest<{ mustChangePassword: boolean }>('/api/student-auth/login', {
        method: 'POST',
        body: JSON.stringify({
          password,
          schoolCode,
          studentId,
        }),
      })

      await navigate({ to: response.mustChangePassword ? '/auth/student-change-password' : '/dashboard' })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Student login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-md rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">SchoolHub</Link>
          <CardTitle className="mt-5 text-3xl">Student Login</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">
            Use your school code, student ID, and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form className="space-y-4" onSubmit={submitLogin}>
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
              onChange={(event) => setSchoolCode(event.target.value)}
              placeholder="School code"
              required
              value={schoolCode}
            />
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="NIS / NISN"
              required
              value={studentId}
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
              {isSubmitting ? 'Logging in...' : 'Login as Student'}
            </Button>
          </form>
          <p className="mt-6 text-sm text-[#6F6A62]">
            Staff account? <Link to="/auth/login" className="font-semibold text-[#2563EB]">Use email login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
