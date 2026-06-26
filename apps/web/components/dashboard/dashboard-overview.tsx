import { Link } from '@tanstack/react-router'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@schoolhub/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@schoolhub/ui/components/table'
import { CalendarDays, MessageSquare } from 'lucide-react'

import { useDashboardRole } from '../../lib/role-context'
import { DashboardHeader } from './dashboard-header'
import { RoleNotice } from './role-notice'

const stats = [
  ['Total Students', '1,248', '+12 this month', 'bg-[#EAF1FF] text-[#2563EB]'],
  ['Attendance Today', '94.2%', '32 absent', 'bg-[#EAF8EF] text-[#16A34A]'],
  ['Active Classes', '42', '8 running now', 'bg-[#FFF4D6] text-[#B45309]'],
  ['Pending Tasks', '18', 'Need review', 'bg-[#FEECEC] text-[#DC2626]'],
]

const students = [
  ['Alya Putri', 'Grade 8A', '78%', 'B-', 'Needs follow-up'],
  ['Raka Pratama', 'Grade 7B', '82%', 'C+', 'Missing assignments'],
  ['Nadia Safira', 'Grade 9A', '88%', 'A-', 'Improving'],
]

export function DashboardOverview() {
  const { role } = useDashboardRole()

  if (role === 'platform_admin') {
    return <PlatformOverview />
  }

  if (role === 'student') {
    return <StudentOverview />
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        subtitle="Manage daily school activity, attendance, and academic progress."
        title={role === 'teacher' ? 'Good morning, Teacher' : 'Good morning, Admin'}
      />

      {role === 'teacher' ? (
        <RoleNotice
          blocked="Organization settings, billing, admin removal, and global platform tools."
          title="Teacher workspace"
          visible="Courses, lessons, students, classes, attendance, assignments, grades, messages, and reports."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, meta, color]) => (
          <Card key={label} className="rounded-[24px] border-[#E5DED3] bg-white">
            <CardHeader className="p-6 pb-0">
              <CardDescription className="text-[#6F6A62]">{label}</CardDescription>
              <CardTitle className="font-mono text-3xl">{value}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <Badge className={color}>{meta}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <OverviewContent />
    </section>
  )
}

function OverviewContent() {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="rounded-[24px] border-[#E5DED3] bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">Attendance Overview</p>
                  <p className="text-sm text-[#6F6A62]">Weekly attendance chart</p>
                </div>
                <Badge variant="success">+3.1%</Badge>
              </div>
              <div className="mt-8 flex h-48 items-end gap-3">
                {[82, 91, 88, 95, 93, 87].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-2xl bg-[#2563EB]" style={{ height: `${height}%` }} />
                    <span className="text-xs text-[#9A948A]">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-[#E5DED3] bg-white">
            <CardContent className="p-6">
              <p className="text-lg font-bold">Class Performance</p>
              <p className="text-sm text-[#6F6A62]">Average score by class</p>
              <div className="mt-7 space-y-5">
                {[
                  ['Grade 7A', 86],
                  ['Grade 8B', 79],
                  ['Grade 9C', 91],
                  ['Grade 10A', 83],
                ].map(([grade, value]) => (
                  <div key={grade}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">{grade}</span>
                      <span className="text-[#6F6A62]">{value}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#E5DED3]">
                      <div className="h-3 rounded-full bg-[#16A34A]" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[24px] border-[#E5DED3] bg-white">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold">Students needing attention</p>
                <p className="text-sm text-[#6F6A62]">Review attendance, grades, and parent follow-up.</p>
              </div>
              <Button asChild variant="secondary">
                <Link to="/dashboard/$section" params={{ section: 'students' }}>View All</Link>
              </Button>
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-[#E5DED3] md:block">
              <Table>
                <TableHeader className="bg-[#F7F4EE] text-[#6F6A62]">
                  <TableRow>
                    {['Student', 'Class', 'Attendance', 'Latest Grade', 'Status', 'Action'].map((head) => (
                      <TableHead key={head} className="font-semibold">{head}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(([name, grade, attendance, latest, status]) => (
                    <TableRow key={name} className="border-[#E5DED3] hover:bg-[#F7F4EE]">
                      <TableCell className="font-semibold">{name}</TableCell>
                      <TableCell className="text-[#6F6A62]">{grade}</TableCell>
                      <TableCell>{attendance}</TableCell>
                      <TableCell>{latest}</TableCell>
                      <TableCell><Badge variant="warning">{status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link to="/dashboard/$section" params={{ section: 'students' }} className="font-semibold text-[#2563EB]">View Profile</Link>
                          <Link to="/dashboard/$section" params={{ section: 'messages' }} className="font-semibold text-[#2563EB]">Message Parent</Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {students.map(([name, grade, attendance, latest, status]) => (
                <Link key={name} to="/dashboard/$section" params={{ section: 'students' }} className="block rounded-2xl border border-[#E5DED3] p-4">
                  <p className="font-semibold">{name}</p>
                  <p className="text-sm text-[#6F6A62]">{grade} · {attendance} · {latest}</p>
                  <Badge className="mt-3 bg-[#FFF4D6] text-[#B45309]">{status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className="rounded-[24px] border-[#E5DED3] bg-white">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-[#2563EB]" />
              <p className="text-lg font-bold">Today&apos;s Schedule</p>
            </div>
            {['08:00 - Morning assembly', '09:00 - Math class observation', '11:00 - Parent meeting', '13:00 - Teacher coordination'].map((item) => (
              <Link key={item} to="/dashboard/$section" params={{ section: 'classes' }} className="mb-3 block rounded-2xl bg-[#F7F4EE] p-4 text-sm font-medium hover:bg-[#EAF1FF]">
                {item}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-[#E5DED3] bg-white">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[#2563EB]" />
              <p className="text-lg font-bold">Recent Messages</p>
            </div>
            {['Parent permission request', 'Teacher grading reminder', 'New school announcement draft'].map((item) => (
              <Link key={item} to="/dashboard/$section" params={{ section: 'messages' }} className="mb-3 block rounded-2xl border border-[#E5DED3] p-4 text-sm font-medium hover:bg-[#F7F4EE]">
                {item}
              </Link>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function PlatformOverview() {
  return (
    <section className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        subtitle="Provision school tenants, monitor tenant status, and manage SaaS-level operations."
        title="Platform operations"
      />
      <RoleNotice
        blocked="Student records, grades, course content, and tenant-private progress unless explicit support access is granted later."
        title="Global admin boundary"
        visible="Tenant list, tenant status, first school admin provisioning, and platform settings."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Active tenants', '12', '3 onboarding'],
          ['Pending setup', '4', 'Need first admin'],
          ['Support tickets', '7', 'No tenant data access'],
        ].map(([label, value, meta]) => (
          <Card key={label} className="rounded-[24px] border-[#E5DED3] bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-[#6F6A62]">{label}</p>
              <p className="mt-3 font-mono text-4xl font-bold">{value}</p>
              <Badge className="mt-4 bg-[#EAF1FF] text-[#2563EB]">{meta}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-[24px] border-[#E5DED3] bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-bold">Tenant provisioning</p>
              <p className="mt-1 text-[#6F6A62]">Create school workspaces and invite the first organization admin.</p>
            </div>
            <Button asChild>
              <Link to="/dashboard/$section" params={{ section: 'platform-tenants' }}>Manage Tenants</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function StudentOverview() {
  return (
    <section className="p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        subtitle="Access assigned courses, open lessons, and track your own progress."
        title="My learning"
      />
      <RoleNotice
        blocked="Other students, teacher tools, admin dashboards, billing, organization settings, and course authoring."
        title="Student workspace"
        visible="Assigned courses, published lessons, own enrollment status, and own progress."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Assigned courses', '5', '2 in progress'],
          ['Lessons completed', '18', '72% complete'],
          ['Pending quizzes', '3', 'Due this week'],
        ].map(([label, value, meta]) => (
          <Card key={label} className="rounded-[24px] border-[#E5DED3] bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-[#6F6A62]">{label}</p>
              <p className="mt-3 font-mono text-4xl font-bold">{value}</p>
              <Badge className="mt-4 bg-[#EAF8EF] text-[#16A34A]">{meta}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 rounded-[24px] border-[#E5DED3] bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-bold">Continue learning</p>
              <p className="mt-1 text-[#6F6A62]">Open assigned courses and continue published lessons.</p>
            </div>
            <Button asChild>
              <Link to="/dashboard/$section" params={{ section: 'my-courses' }}>Open My Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
