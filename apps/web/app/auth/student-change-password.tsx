import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { apiRequest } from '../../lib/api'

export const Route = createFileRoute('/auth/student-change-password')({
  component: StudentChangePasswordPage,
})

function StudentChangePasswordPage() {
  const navigate = Route.useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await apiRequest('/api/student-auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: password,
        }),
      })

      await navigate({ to: '/dashboard' })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to change password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-md rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <CardTitle className="mt-5 text-3xl">Change password</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">
            Set a private password before opening your student dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form className="space-y-4" onSubmit={submitPassword}>
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              required
              type="password"
              value={password}
            />
            <Input
              className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              required
              type="password"
              value={confirmPassword}
            />
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Saving...' : 'Save Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
