import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@schoolhub/ui/components/dialog'
import { Input } from '@schoolhub/ui/components/input'
import { Textarea } from '@schoolhub/ui/components/textarea'
import { CalendarDays, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/demo')({
  component: DemoPage,
})

function DemoPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EE] p-4 text-[#151515] sm:p-8">
      <div className="container-max grid min-h-[calc(100vh-64px)] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link to="/" className="text-sm font-semibold text-[#2563EB]">Back to SchoolHub</Link>
          <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-tight tracking-tight">Book a demo for your school team.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#6F6A62]">
            See how SchoolHub can organize attendance, classes, assignments, reports, and parent communication in one calm dashboard.
          </p>
          <div className="mt-8 space-y-4">
            {['School admin dashboard walkthrough', 'Role-based teacher and student views', 'Supabase-ready data model discussion'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#16A34A]" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>
        <Card className="rounded-[28px] border-[#E5DED3] bg-white">
          <CardHeader className="p-8 pb-0">
            <CalendarDays className="mb-5 h-10 w-10 text-[#2563EB]" />
            <CardTitle>Demo request</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {['Name', 'School name', 'Email', 'Phone'].map((label) => (
              <Input key={label} className="h-12 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]" placeholder={label} />
            ))}
          </div>
          <Textarea className="mt-4 min-h-28 rounded-2xl border-[#E5DED3] bg-[#F7F4EE]" placeholder="What workflows do you want to improve first?" />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Submit Request</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demo request ready</DialogTitle>
                  <DialogDescription>
                    Positive dummy flow confirmed. Continue to the dashboard preview.
                  </DialogDescription>
                </DialogHeader>
                <Button asChild>
                  <Link to="/dashboard">Continue to Dashboard</Link>
                </Button>
              </DialogContent>
            </Dialog>
            <Button asChild variant="secondary">
              <Link to="/dashboard">View Dashboard Preview</Link>
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
