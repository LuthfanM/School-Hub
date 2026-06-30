import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { getApiBaseUrl } from '../../lib/api'

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
      const response = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: password,
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
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-md rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">SchoolHub</Link>
          <CardTitle className="mt-5 text-3xl">Reset password</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">
            Enter a new password for this account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {isComplete ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                Password updated. You can log in with the new password now.
              </div>
              <Button asChild className="w-full">
                <Link to="/auth/login">Back to login</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submitReset}>
              <Input
                className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
                disabled={!token || isSubmitting}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="New password"
                required
                type="password"
                value={password}
              />
              <Input
                className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]"
                disabled={!token || isSubmitting}
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                required
                type="password"
                value={confirmPassword}
              />
              {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
              <Button className="w-full" disabled={!token || isSubmitting} type="submit">
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
