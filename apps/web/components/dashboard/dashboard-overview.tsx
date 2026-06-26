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
import { Activity, Building2, CalendarDays, CheckCircle2, Database, MailPlus, MessageSquare, Settings2, ShieldCheck } from 'lucide-react'

import { useDashboardRole } from '../../lib/role-context'
import { colors, dashboardColors } from '../../styles/colors'
import { DashboardHeader } from './dashboard-header'
import { RoleNotice } from './role-notice'

const stats = [
  ['Total Students', '1,248', '+12 this month', colors.brand.badge],
  ['Attendance Today', '94.2%', '32 absent', colors.success.badge],
  ['Active Classes', '42', '8 running now', colors.warning.badge],
  ['Pending Tasks', '18', 'Need review', colors.danger.badge],
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
          <Card key={label} className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardHeader className="p-6 pb-0">
              <CardDescription className={colors.app.muted}>{label}</CardDescription>
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
          <Card className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">Attendance Overview</p>
                  <p className={`text-sm ${colors.app.muted}`}>Weekly attendance chart</p>
                </div>
                <Badge variant="success">+3.1%</Badge>
              </div>
              <div className="mt-8 flex h-48 items-end gap-3">
                {[82, 91, 88, 95, 93, 87].map((height, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div className={`w-full rounded-t-2xl ${colors.brand.bg}`} style={{ height: `${height}%` }} />
                    <span className={`text-xs ${colors.app.mutedLight}`}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <p className="text-lg font-bold">Class Performance</p>
              <p className={`text-sm ${colors.app.muted}`}>Average score by class</p>
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
                      <span className={colors.app.muted}>{value}%</span>
                    </div>
                    <div className={`h-3 rounded-full ${colors.app.borderBg}`}>
                      <div className={`h-3 rounded-full ${colors.success.bg}`} style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`rounded-[24px] ${dashboardColors.card}`}>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold">Students needing attention</p>
                <p className={`text-sm ${colors.app.muted}`}>Review attendance, grades, and parent follow-up.</p>
              </div>
              <Button asChild variant="secondary">
                <Link to="/dashboard/$section" params={{ section: 'students' }}>View All</Link>
              </Button>
            </div>
            <div className={`hidden overflow-hidden rounded-2xl border md:block ${colors.app.border}`}>
              <Table>
                <TableHeader className={dashboardColors.tableHeader}>
                  <TableRow>
                    {['Student', 'Class', 'Attendance', 'Latest Grade', 'Status', 'Action'].map((head) => (
                      <TableHead key={head} className="font-semibold">{head}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map(([name, grade, attendance, latest, status]) => (
                    <TableRow key={name} className={`${colors.app.border} ${colors.app.backgroundHover}`}>
                      <TableCell className="font-semibold">{name}</TableCell>
                      <TableCell className={colors.app.muted}>{grade}</TableCell>
                      <TableCell>{attendance}</TableCell>
                      <TableCell>{latest}</TableCell>
                      <TableCell><Badge variant="warning">{status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link to="/dashboard/$section" params={{ section: 'students' }} className={dashboardColors.link}>View Profile</Link>
                          <Link to="/dashboard/$section" params={{ section: 'messages' }} className={dashboardColors.link}>Message Parent</Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {students.map(([name, grade, attendance, latest, status]) => (
                <Link key={name} to="/dashboard/$section" params={{ section: 'students' }} className={`block rounded-2xl border p-4 ${colors.app.border}`}>
                  <p className="font-semibold">{name}</p>
                  <p className={`text-sm ${colors.app.muted}`}>{grade} · {attendance} · {latest}</p>
                  <Badge className={`mt-3 ${colors.warning.badge}`}>{status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-6">
        <Card className={`rounded-[24px] ${dashboardColors.card}`}>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <CalendarDays className={`h-5 w-5 ${colors.brand.icon}`} />
              <p className="text-lg font-bold">Today&apos;s Schedule</p>
            </div>
            {['08:00 - Morning assembly', '09:00 - Math class observation', '11:00 - Parent meeting', '13:00 - Teacher coordination'].map((item) => (
              <Link key={item} to="/dashboard/$section" params={{ section: 'classes' }} className={`mb-3 block rounded-2xl p-4 text-sm font-medium ${colors.app.background} ${colors.brand.hoverBg}`}>
                {item}
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className={`rounded-[24px] ${dashboardColors.card}`}>
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <MessageSquare className={`h-5 w-5 ${colors.brand.icon}`} />
              <p className="text-lg font-bold">Recent Messages</p>
            </div>
            {['Parent permission request', 'Teacher grading reminder', 'New school announcement draft'].map((item) => (
              <Link key={item} to="/dashboard/$section" params={{ section: 'messages' }} className={`mb-3 block rounded-2xl border p-4 text-sm font-medium ${colors.app.border} ${colors.app.backgroundHover}`}>
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
        subtitle="Monitor platform operations, tenant onboarding, support setup, and global SaaS health."
        title="Platform Summary"
      />
      <RoleNotice
        blocked="Student records, grades, course content, and tenant-private progress unless explicit support access is granted later."
        title="Global admin boundary"
        visible="Tenant list, tenant status, first school admin provisioning, and platform settings."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total tenants', '16', '+3 this month', colors.brand.badge],
          ['Active tenants', '12', 'Healthy'],
          ['Pending setup', '3', 'Need first admin'],
          ['Suspended tenants', '1', 'Review required'],
        ].map(([label, value, meta, color]) => (
          <Card key={label} className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <p className={`text-sm font-semibold ${colors.app.muted}`}>{label}</p>
              <p className="mt-3 font-mono text-4xl font-bold">{value}</p>
              <Badge className={color ?? `mt-4 ${colors.warning.badge}`}>{meta}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold">Setup queue</p>
                  <p className={`text-sm ${colors.app.muted}`}>Operational tasks before a school workspace is ready.</p>
                </div>
                <Button asChild variant="secondary">
                  <Link to="/dashboard/$section" params={{ section: 'platform-tenants' }}>View Tenants</Link>
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['Nusantara Academy', 'Invite first organization admin', 'pending'],
                  ['Harapan Bangsa', 'Confirm custom domain', 'pending'],
                  ['Bina Insan Program', 'Review suspended status', 'review'],
                ].map(([name, task, tone]) => (
                  <Link key={name} to="/dashboard/$section" params={{ section: 'platform-tenants' }} className={`rounded-2xl border p-4 transition ${dashboardColors.panel} ${colors.brand.hoverBg}`}>
                    <Badge className={tone === 'review' ? colors.danger.badge : colors.warning.badge}>
                      {tone === 'review' ? 'Review' : 'Pending setup'}
                    </Badge>
                    <p className="mt-3 font-semibold">{name}</p>
                    <p className={`mt-1 text-sm leading-6 ${colors.app.muted}`}>{task}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Activity className={`h-5 w-5 ${colors.brand.icon}`} />
                <p className="text-lg font-bold">Recent platform activity</p>
              </div>
              <div className="space-y-3">
                {[
                  ['Tenant created', 'Cendekia Learning workspace was provisioned.'],
                  ['First admin invited', 'Nusantara Academy is waiting for admin acceptance.'],
                  ['Tenant status changed', 'Bina Insan Program was marked suspended for review.'],
                ].map(([title, description]) => (
                  <div key={title} className={`rounded-2xl border p-4 ${colors.app.border}`}>
                    <p className="font-semibold">{title}</p>
                    <p className={`mt-1 text-sm ${colors.app.muted}`}>{description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <p className="text-lg font-bold">Quick actions</p>
              <div className="mt-5 space-y-3">
                {[
                  ['Create tenant', 'platform-tenants', Building2],
                  ['Invite first admin', 'platform-tenants', MailPlus],
                  ['Open platform settings', 'platform-settings', Settings2],
                ].map(([label, section, Icon]) => (
                  <Link key={label as string} to="/dashboard/$section" params={{ section: section as 'platform-tenants' | 'platform-settings' }} className={`flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold ${colors.app.background} ${colors.brand.hoverBg}`}>
                    <Icon className={`h-4 w-4 ${colors.brand.icon}`} />
                    {label as string}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <p className="text-lg font-bold">Operational health</p>
              <div className="mt-5 space-y-4">
                {[
                  ['API', 'Online', CheckCircle2],
                  ['PostgreSQL', 'Connected', Database],
                  ['Auth', 'Better Auth enabled', ShieldCheck],
                ].map(([label, status, Icon]) => (
                  <div key={label as string} className="flex items-center justify-between gap-4">
                    <span className={`flex items-center gap-2 text-sm ${colors.app.muted}`}>
                      <Icon className={`h-4 w-4 ${colors.success.icon}`} />
                      {label as string}
                    </span>
                    <span className="text-right text-sm font-semibold">{status as string}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
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
          <Card key={label} className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <p className={`text-sm font-semibold ${colors.app.muted}`}>{label}</p>
              <p className="mt-3 font-mono text-4xl font-bold">{value}</p>
              <Badge className={`mt-4 ${colors.success.badge}`}>{meta}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className={`mt-6 rounded-[24px] ${dashboardColors.card}`}>
        <CardContent className="p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xl font-bold">Continue learning</p>
              <p className={`mt-1 ${colors.app.muted}`}>Open assigned courses and continue published lessons.</p>
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
