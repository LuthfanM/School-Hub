import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { getApiBaseUrl } from '../../lib/api'
import { firstValidationMessage, passwordConfirmationFormSchema } from '../../lib/form-validation'

export const Route = createFileRoute('/auth/reset-password')({
  validateSearch: (search) => ({
    error: typeof search.error === 'string' ? search.error : null,
    token: typeof search.token === 'string' ? search.token : null,
  }),
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { error: tokenError, token } = Route.useSearch()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(tokenError ? 'This reset link is invalid or expired.' : null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  async function submitReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token) {
      setError('This reset link is missing a token.')
      return
    }

    const parsedForm = passwordConfirmationFormSchema.safeParse({ password, confirmPassword })
    if (!parsedForm.success) {
      setError(firstValidationMessage(parsedForm.error))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: parsedForm.data.password,
          token,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const message =
          body && typeof body === 'object' && 'message' in body
            ? String(body.message)
            : 'Failed to reset password.'

        throw new Error(message)
      }

      setIsComplete(true)
      setPassword('')
      setConfirmPassword('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to reset password.')
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
          <CardTitle className="mt-6 text-3xl text-[#15313a]">Reset password</CardTitle>
          <CardDescription className="text-base text-[#526a70]">
            Enter a new password for this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isComplete ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#c7e4d7] bg-[#edf9f3] p-4 text-sm font-medium text-[#1d6d54]">
                Password updated. You can log in with the new password now.
              </div>
              <Button asChild className="w-full rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]">
                <Link to="/auth/login">Back to login</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submitReset}>
              <Input
                className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
                disabled={!token || isSubmitting}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                required
                type="password"
                value={password}
              />
              <Input
                className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]"
                disabled={!token || isSubmitting}
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                required
                type="password"
                value={confirmPassword}
              />
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <Button className="w-full rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]" disabled={!token || isSubmitting} type="submit">
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
