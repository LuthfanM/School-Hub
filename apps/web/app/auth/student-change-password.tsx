import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { apiRequest } from '../../lib/api'
import { firstValidationMessage, passwordConfirmationFormSchema } from '../../lib/form-validation'

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

    const parsedForm = passwordConfirmationFormSchema.safeParse({ password, confirmPassword })
    if (!parsedForm.success) {
      setError(firstValidationMessage(parsedForm.error))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await apiRequest('/api/student-auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: parsedForm.data.password,
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
    <main className="schoolhub-page grid min-h-[100dvh] place-items-center p-4 text-[#15313a]">
      <Card className="w-full max-w-md rounded-[2rem] border-[#d8e5df] bg-white/92 shadow-[0_24px_70px_rgba(18,52,59,0.10)]">
        <CardHeader className="p-8 pb-0">
          <CardTitle className="mt-5 text-3xl text-[#15313a]">Change password</CardTitle>
          <CardDescription className="text-base text-[#526a70]">
            Set a private password before opening your student dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form className="space-y-4" onSubmit={submitPassword}>
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              required
              type="password"
              value={password}
            />
            <Input
              className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
              minLength={8}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              required
              type="password"
              value={confirmPassword}
            />
            {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
            <Button className="w-full rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Saving...' : 'Save Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
