import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Checkbox } from '@schoolhub/ui/components/checkbox'
import { Input } from '@schoolhub/ui/components/input'

export const Route = createFileRoute('/auth/register')({
  component: RegisterPage,
})

function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-lg rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">SchoolHub</Link>
          <CardTitle className="mt-5 text-3xl">Create school workspace</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">Dummy onboarding form. Continue routes into the dashboard preview.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]" placeholder="Full name" />
          <Input className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]" placeholder="School name" />
          <Input className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE] sm:col-span-2" placeholder="Email address" />
          <Input className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE] sm:col-span-2" placeholder="Password" type="password" />
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm text-[#6F6A62]">
          <Checkbox defaultChecked />
          I agree to set up this workspace as a dummy preview.
        </label>
        <Button asChild className="mt-6 w-full">
          <Link to="/dashboard">Create Workspace</Link>
        </Button>
        <p className="mt-6 text-sm text-[#6F6A62]">
          Already have an account? <Link to="/auth/login" className="font-semibold text-[#2563EB]">Login</Link>
        </p>
        </CardContent>
      </Card>
    </main>
  )
}
