import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { apiRequest } from '../../lib/api'
import { firstValidationMessage, studentLoginFormSchema } from '../../lib/form-validation'

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
      const parsedForm = studentLoginFormSchema.safeParse({ schoolCode, studentId, password })
      if (!parsedForm.success) {
        setError(firstValidationMessage(parsedForm.error))
        return
      }

      const response = await apiRequest<{ mustChangePassword: boolean }>('/api/student-auth/login', {
        method: 'POST',
        body: JSON.stringify({
          password: parsedForm.data.password,
          schoolCode: parsedForm.data.schoolCode,
          studentId: parsedForm.data.studentId,
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
    <main className="schoolhub-page grid min-h-[100dvh] place-items-center p-4 text-[#15313a]">
      <Card className="w-full max-w-md rounded-[2rem] border-[#d8e5df] bg-white/92 shadow-[0_24px_70px_rgba(18,52,59,0.10)]">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="inline-flex items-center gap-3 text-sm font-semibold text-[#1d6d54]">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-[#12343b] text-xs font-bold text-white">SH</span>
            SchoolHub
          </Link>
          <CardTitle className="mt-6 text-3xl text-[#15313a]">Student Login</CardTitle>
          <CardDescription className="text-base text-[#526a70]">
            Use your school code, student ID, and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form className="space-y-4" onSubmit={submitLogin}>
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
              onChange={(event) => setSchoolCode(event.target.value)}
              placeholder="School code"
              required
              value={schoolCode}
            />
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="NIS / NISN"
              required
              value={studentId}
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
              {isSubmitting ? 'Logging in...' : 'Login as Student'}
            </Button>
          </form>
          <p className="mt-6 text-sm text-[#526a70]">
            Staff account? <Link to="/auth/login" className="font-semibold text-[#1d6d54]">Use email login</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
