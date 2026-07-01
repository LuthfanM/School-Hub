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
    <main className="schoolhub-page min-h-[100dvh] p-4 text-[#15313a] sm:p-8">
      <div className="container-max grid min-h-[calc(100dvh-64px)] items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <Link to="/" className="text-sm font-semibold text-[#1d6d54]">Back to SchoolHub</Link>
          <h1 className="mt-6 max-w-2xl text-5xl font-bold leading-tight tracking-tight">Book a demo for your school team.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#526a70]">
            See how SchoolHub can organize attendance, classes, assignments, reports, and parent communication in one calm dashboard.
          </p>
          <div className="mt-8 space-y-4">
            {['School admin dashboard walkthrough', 'Role-based teacher and student views', 'PostgreSQL-backed data model discussion'].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#1d6d54]" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </section>
        <Card className="rounded-[2rem] border-[#d8e5df] bg-white/92 shadow-[0_24px_70px_rgba(18,52,59,0.10)]">
          <CardHeader className="p-8 pb-0">
            <CalendarDays className="mb-5 h-10 w-10 text-[#1d6d54]" />
            <CardTitle>Demo request</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {['Name', 'School name', 'Email', 'Phone'].map((label) => (
              <Input key={label} className="h-12 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]" placeholder={label} />
            ))}
          </div>
          <Textarea className="mt-4 min-h-28 rounded-2xl border-[#d8e5df] bg-[#f7fbf8]" placeholder="What workflows do you want to improve first?" />
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]">Submit Request</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Demo request ready</DialogTitle>
                  <DialogDescription>
                    Positive dummy flow confirmed. Continue to the dashboard preview.
                  </DialogDescription>
                </DialogHeader>
                <Button asChild className="rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]">
                  <Link to="/dashboard">Continue to Dashboard</Link>
                </Button>
              </DialogContent>
            </Dialog>
            <Button asChild variant="outline" className="rounded-full border-[#d8e5df] bg-white/82">
              <Link to="/dashboard">View Dashboard Preview</Link>
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
