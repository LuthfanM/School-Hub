import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'

export const Route = createFileRoute('/auth/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="w-full max-w-md rounded-[28px] border-[#E5DED3] bg-white">
        <CardHeader className="p-8 pb-0">
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">SchoolHub</Link>
          <CardTitle className="mt-5 text-3xl">Login</CardTitle>
          <CardDescription className="text-base text-[#6F6A62]">Use the positive dummy flow to enter the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
        <div className="space-y-4">
          <Input className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]" placeholder="admin@school.edu" />
          <Input className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]" placeholder="Password" type="password" />
          <Button asChild className="w-full">
            <Link to="/dashboard">Login</Link>
          </Button>
        </div>
        <p className="mt-6 text-sm text-[#6F6A62]">
          New school? <Link to="/auth/register" className="font-semibold text-[#2563EB]">Create account</Link>
        </p>
        </CardContent>
      </Card>
    </main>
  )
}
