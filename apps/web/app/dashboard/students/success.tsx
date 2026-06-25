import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/students/success')({
  component: StudentSuccessPage,
})

function StudentSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F4EE] p-4 text-[#151515]">
      <Card className="max-w-xl rounded-[28px] border-[#E5DED3] bg-white text-center">
        <CardContent className="p-8">
        <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-[#16A34A]" />
        <h1 className="text-3xl font-bold">Student added successfully.</h1>
        <p className="mt-3 text-[#6F6A62]">This is the dummy success state. Supabase saving can be added later when you are ready.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard/$section" params={{ section: 'students' }}>View Students</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
        </div>
        </CardContent>
      </Card>
    </main>
  )
}
