import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { Skeleton } from '@schoolhub/ui/components/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@schoolhub/ui/components/tabs'
import { ArrowLeft, CircleAlert, Filter, Plus, Search } from 'lucide-react'

const titles: Record<string, string> = {
  students: 'Students',
  teachers: 'Teachers',
  classes: 'Classes',
  attendance: 'Attendance',
  assignments: 'Assignments',
  grades: 'Grades',
  messages: 'Messages',
  reports: 'Reports',
  billing: 'Billing',
  settings: 'Settings',
}

export const Route = createFileRoute('/dashboard/$section')({
  component: DashboardSectionPage,
})

function DashboardSectionPage() {
  const { section } = Route.useParams()
  const title = titles[section] ?? 'Dashboard'
  const isBilling = section === 'billing'

  return (
    <main className="min-h-screen bg-[#F7F4EE] p-4 text-[#151515] sm:p-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#6F6A62] hover:text-[#151515]">
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <Card className="rounded-[28px] border-[#E5DED3] bg-white">
          <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563EB]">SchoolHub</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
              <p className="mt-3 max-w-2xl text-[#6F6A62]">
                Dummy positive-flow screen for the {title.toLowerCase()} workspace. Actions are wired to valid paths so navigation can be tested before data integration.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link to="/dashboard/$section" params={{ section: 'reports' }}><Filter className="h-4 w-4" /> Filter</Link>
              </Button>
              <Button asChild>
                <Link to={section === 'students' ? '/dashboard/students/new' : '/demo'}>
                  <Plus className="h-4 w-4" />
                  Add {title.slice(0, -1) || title}
                </Link>
              </Button>
            </div>
          </div>

          {isBilling ? (
            <Card className="mt-8 rounded-[24px] border-[#E5DED3] bg-[#FFF4D6]">
              <CardContent className="p-6">
              <CircleAlert className="mb-4 h-8 w-8 text-[#B45309]" />
              <h2 className="text-xl font-bold">You do not have permission to view billing settings.</h2>
              <p className="mt-2 text-[#6F6A62]">Contact your school admin to request billing access.</p>
              <Button asChild className="mt-5">
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative mt-8">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6F6A62]" />
                <Input className="h-12 rounded-full border-[#E5DED3] bg-[#F7F4EE] pl-10" placeholder={`Search ${title.toLowerCase()}`} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {['Active', 'Pending review', 'Completed'].map((status, index) => (
                  <Link key={status} to="/dashboard" className="rounded-[24px] border border-[#E5DED3] bg-[#F7F4EE] p-5 transition hover:-translate-y-1 hover:bg-[#EAF1FF]">
                    <p className="font-mono text-3xl font-semibold">{[128, 18, 94][index]}</p>
                    <Badge className="mt-2" variant={index === 1 ? 'warning' : 'secondary'}>{status}</Badge>
                    <p className="mt-2 text-sm leading-6 text-[#6F6A62]">Open the overview to inspect details and next steps.</p>
                  </Link>
                ))}
              </div>
              <Tabs defaultValue="empty" className="mt-6">
                <TabsList>
                  <TabsTrigger value="empty">Empty</TabsTrigger>
                  <TabsTrigger value="loading">Loading</TabsTrigger>
                </TabsList>
                <TabsContent value="empty" className="rounded-[24px] border border-dashed border-[#E5DED3] bg-white p-8 text-center">
                  <h2 className="text-xl font-bold">No live {title.toLowerCase()} data connected yet.</h2>
                  <p className="mx-auto mt-2 max-w-xl text-[#6F6A62]">
                    This is ready for Supabase table data later. For now, use the buttons to confirm the screen flow.
                  </p>
                  <div className="mt-5 flex justify-center gap-3">
                    <Button asChild>
                      <Link to="/dashboard">View Overview</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link to="/demo">Book Demo</Link>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="loading" className="rounded-[24px] border border-[#E5DED3] bg-white p-8">
                  <Skeleton className="h-8 w-48" />
                  <div className="mt-6 space-y-3">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
