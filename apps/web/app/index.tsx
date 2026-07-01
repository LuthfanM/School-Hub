import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { Skeleton } from '@schoolhub/ui/components/skeleton'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

const navItems = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Workflows', href: '/#workflows' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Security', href: '/#security' },
]

const operatingSignals = [
  'Attendance',
  'Class roster',
  'Grades',
  'Assignments',
  'Announcements',
  'Student portal',
  'Parent updates',
  'Reports',
]

const roleCards = [
  {
    title: 'School admin',
    description: 'Set up classes, users, academic years, and tenant rules without losing control of school data.',
    icon: Users,
  },
  {
    title: 'Teacher',
    description: 'Take attendance, assign work, publish grades, and keep class updates close to the roster.',
    icon: ClipboardCheck,
  },
  {
    title: 'Student',
    description: 'Use NIS or NISN login to see schedules, grades, quizzes, assignments, and announcements.',
    icon: GraduationCap,
  },
  {
    title: 'Parent',
    description: 'Follow attendance, class announcements, and progress signals from the right school workspace.',
    icon: MessageCircle,
  },
]

const modules = [
  {
    title: 'Class command',
    description: 'Homeroom teachers, active years, rosters, timetables, subjects, and announcements stay tied to the class.',
    icon: BookOpen,
    className: 'lg:col-span-2',
  },
  {
    title: 'Attendance rhythm',
    description: 'Teachers can move from class context to attendance capture without searching through admin screens.',
    icon: ClipboardCheck,
  },
  {
    title: 'Student access',
    description: 'Students without email still get a protected login using school code, NIS or NISN, and password.',
    icon: GraduationCap,
  },
  {
    title: 'Academic signals',
    description: 'Grades, quizzes, assignments, and reports become easier to scan by role and organization.',
    icon: BarChart3,
    className: 'lg:col-span-2',
  },
]

const plans = [
  {
    name: 'Starter',
    detail: 'For small schools or tutoring centers starting with core records.',
    price: '$79',
    features: ['Up to 100 students', 'Class setup', 'Teacher accounts', 'Student login'],
  },
  {
    name: 'School',
    detail: 'For schools running daily class, attendance, and academic workflows.',
    price: '$249',
    features: ['Up to 1,000 students', 'Attendance', 'Assignments', 'Grades', 'Parent updates'],
    featured: true,
  },
  {
    name: 'Enterprise',
    detail: 'For school groups that need deeper reporting and rollout support.',
    price: 'Custom',
    features: ['Unlimited students', 'Advanced reports', 'Custom integrations', 'Dedicated support'],
  },
]

const dashboardLinks = [
  { label: 'Overview' },
  { label: 'Students', section: 'students' },
  { label: 'Teachers', section: 'teachers' },
  { label: 'Classes', section: 'classes' },
  { label: 'Assignments', section: 'assignments' },
  { label: 'Grades', section: 'grades' },
]

function SchoolHubLogo() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#12343b] text-sm font-bold text-white shadow-[0_18px_40px_rgba(18,52,59,0.22)]">
        SH
      </span>
      <span>
        <span className="block text-lg font-bold leading-none text-[#15313a]">SchoolHub</span>
        <span className="text-xs font-medium text-[#60737a]">School tenant SaaS</span>
      </span>
    </span>
  )
}

function SurfaceFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2rem] border border-[#d8e5df] bg-white/62 p-1.5 shadow-[0_24px_70px_rgba(18,52,59,0.10)] ${className}`}>
      <div className="rounded-[calc(2rem-0.375rem)] border border-white bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
        {children}
      </div>
    </div>
  )
}

function PrimaryCta({ to, children }: { to: '/demo' | '/auth/login'; children: ReactNode }) {
  return (
    <Button asChild size="lg" className="group rounded-full bg-[#12343b] pl-6 pr-2 text-white shadow-[0_18px_38px_rgba(18,52,59,0.22)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#1d4b52] active:scale-[0.98]">
      <Link to={to}>
        <span>{children}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/14 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </Button>
  )
}

function CampusPreview() {
  return (
    <div className="schoolhub-reveal relative" style={{ '--delay': '120ms' } as CSSProperties}>
      <div className="absolute -left-4 top-8 hidden rounded-2xl border border-[#d8e5df] bg-white/90 p-3 shadow-[0_18px_44px_rgba(18,52,59,0.12)] md:block schoolhub-float">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dff4eb] text-[#1d6d54]">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#15313a]">Attendance open</p>
            <p className="text-xs text-[#60737a]">Grade 10-A</p>
          </div>
        </div>
      </div>
      <div className="absolute -right-3 bottom-12 hidden rounded-2xl border border-[#d8e5df] bg-white/90 p-3 shadow-[0_18px_44px_rgba(18,52,59,0.12)] lg:block schoolhub-float-delay">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f4ff] text-[#24577a]">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#15313a]">Next class</p>
            <p className="text-xs text-[#60737a]">Science at 09:30</p>
          </div>
        </div>
      </div>

      <SurfaceFrame>
        <div className="overflow-hidden rounded-[calc(2rem-0.375rem)]">
          <div className="border-b border-[#d8e5df] bg-[#f7fbf8] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#15313a]">School day command</p>
                <p className="text-xs text-[#60737a]">North Valley School workspace</p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[#d8e5df] bg-white px-3 py-2 text-xs text-[#60737a] sm:flex">
                <Search className="h-3.5 w-3.5" />
                Search roster
              </div>
            </div>
          </div>
          <div className="grid gap-4 bg-[#eef7f1] p-4 lg:grid-cols-[190px_1fr]">
            <aside className="rounded-3xl bg-[#12343b] p-4 text-white">
              <p className="mb-5 text-sm font-semibold">Today</p>
              <div className="space-y-1">
                {dashboardLinks.map((item, index) => {
                  const className = `flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    index === 0 ? 'bg-[#dff4eb] text-[#12343b]' : 'text-slate-200 hover:bg-white/10'
                  }`

                  return item.section ? (
                    <Link key={item.label} to="/dashboard/$section" params={{ section: item.section }} className={className}>
                      {item.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <Link key={item.label} to="/dashboard" className={className}>
                      {item.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )
                })}
              </div>
            </aside>
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Present', '524', '91 checked in'],
                  ['Classes', '36', '12 live now'],
                  ['Reviews', '18', 'Need attention'],
                ].map(([label, value, meta]) => (
                  <Card key={label} className="rounded-3xl border-[#d8e5df] bg-white shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs font-medium text-[#60737a]">{label}</p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[#15313a]">{value}</p>
                      <p className="mt-1 text-xs text-[#60737a]">{meta}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="rounded-3xl border-[#d8e5df] bg-white shadow-none">
                <CardContent className="p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-[#15313a]">Roster is syncing</p>
                      <p className="text-sm text-[#60737a]">The layout holds steady while student rows load.</p>
                    </div>
                    <Badge className="border-[#c7e4d7] bg-[#edf9f3] text-[#1d6d54]" variant="outline">
                      Live roster
                    </Badge>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#d8e5df] bg-[#f7fbf8] p-3">
                          <Skeleton className="schoolhub-skeleton h-10 w-10 rounded-2xl bg-[#dff4eb]" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="schoolhub-skeleton h-3 w-2/3 bg-[#dff4eb]" />
                            <Skeleton className="schoolhub-skeleton h-3 w-1/2 bg-[#dff4eb]" />
                          </div>
                          <Skeleton className="schoolhub-skeleton h-8 w-16 rounded-full bg-[#dff4eb]" />
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-[#d8e5df] bg-[#12343b] p-4 text-white">
                      <p className="text-sm font-semibold">Attendance curve</p>
                      <div className="mt-5 flex h-28 items-end gap-2">
                        {['h-16', 'h-20', 'h-[4.5rem]', 'h-24', 'h-20', 'h-28'].map((height, index) => (
                          <div key={`${height}-${index}`} className="flex flex-1 flex-col items-center gap-2">
                            <div className={`w-full rounded-t-xl bg-[#8bd8bd] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-y-105 ${height}`} />
                            <span className="text-[10px] text-slate-300">{['M', 'T', 'W', 'T', 'F', 'S'][index]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SurfaceFrame>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="schoolhub-page min-h-[100dvh] overflow-hidden text-[#15313a]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#15313a]">
        Skip to content
      </a>

      <nav className="sticky top-3 z-40 px-3">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 rounded-full border border-[#d8e5df] bg-white/92 px-3 pl-4 shadow-[0_18px_50px_rgba(18,52,59,0.10)] backdrop-blur">
          <Link to="/" aria-label="SchoolHub home">
            <SchoolHubLogo />
          </Link>
          <div className="hidden items-center gap-6 text-sm font-medium text-[#60737a] lg:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors duration-300 hover:text-[#15313a]">
                {item.label}
              </a>
            ))}
            <Link to="/demo" className="transition-colors duration-300 hover:text-[#15313a]">
              Demo
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth/login" className="hidden text-sm font-semibold text-[#60737a] transition-colors duration-300 hover:text-[#15313a] sm:inline">
              Login
            </Link>
            <PrimaryCta to="/demo">Book Demo</PrimaryCta>
          </div>
        </div>
      </nav>

      <section id="main-content" className="container-max grid items-center gap-12 pb-20 pt-14 lg:min-h-[calc(100dvh-84px)] lg:grid-cols-[0.9fr_1.1fr] lg:pb-24 lg:pt-16">
        <div className="schoolhub-reveal max-w-3xl" style={{ '--delay': '40ms' } as CSSProperties}>
          <Badge className="border-[#c7e4d7] bg-[#edf9f3] px-3 py-1 text-[#1d6d54]" variant="outline">
            Modern school operations
          </Badge>
          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.04] tracking-normal text-[#15313a] sm:text-5xl lg:text-6xl">
            A calm control room for every school day.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-[#526a70] sm:text-lg">
            SchoolHub connects classes, attendance, grades, student login, and tenant-safe administration in one trusted workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PrimaryCta to="/demo">Book Demo</PrimaryCta>
            <Button asChild size="lg" variant="outline" className="rounded-full border-[#c7d9d2] bg-white/82 text-[#15313a] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#edf9f3] active:scale-[0.98]">
              <Link to="/auth/student-login">Login as Student</Link>
            </Button>
          </div>
        </div>
        <CampusPreview />
      </section>

      <section className="border-y border-[#d8e5df] bg-white/74 py-3" aria-label="SchoolHub modules">
        <div className="overflow-hidden">
          <div className="schoolhub-marquee flex w-max gap-3 px-4">
            {[...operatingSignals, ...operatingSignals].map((signal, index) => (
              <span key={`${signal}-${index}`} className="rounded-full border border-[#d8e5df] bg-[#f7fbf8] px-4 py-2 text-sm font-medium text-[#526a70]">
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="platform" className="container-max py-20 lg:py-28">
        <div className="schoolhub-reveal max-w-3xl">
          <h2 className="text-balance text-3xl font-bold tracking-normal sm:text-5xl">Built around how schools actually move.</h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-[#526a70]">
            The experience stays simple for the user, while tenant context, permissions, and school records stay strict underneath.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-[1.05fr_0.95fr]">
          {roleCards.map((card, index) => {
            const Icon = card.icon
            return (
              <Card
                key={card.title}
                className={`schoolhub-card-hover rounded-[1.75rem] border-[#d8e5df] bg-white/90 shadow-none ${index === 0 || index === 3 ? 'lg:translate-y-6' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf9f3] text-[#1d6d54]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#15313a]">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#526a70]">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section id="workflows" className="container-max py-20 lg:py-28">
        <SurfaceFrame>
          <div className="grid gap-8 rounded-[calc(2rem-0.375rem)] bg-[#f7fbf8] p-5 lg:grid-cols-[0.82fr_1.18fr] lg:p-8">
            <div className="schoolhub-reveal flex flex-col justify-between rounded-[1.65rem] bg-[#12343b] p-7 text-white lg:min-h-[520px]">
              <div>
                <Badge className="border-white/16 bg-white/10 text-white" variant="outline">
                  Role-aware workflows
                </Badge>
                <h2 className="mt-6 text-balance text-3xl font-bold tracking-normal sm:text-5xl">
                  Each role gets the right surface.
                </h2>
                <p className="mt-5 text-pretty leading-8 text-slate-300">
                  Platform admin, owner, school admin, teacher, and student paths stay separated without making the product feel heavy.
                </p>
              </div>
              <div className="mt-10 grid gap-3">
                {['Tenant-aware login', 'Student credentials', 'Reset password', 'Class announcements'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-sm">
                    <Check className="h-4 w-4 text-[#8bd8bd]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((feature) => {
                const Icon = feature.icon
                return (
                  <Card key={feature.title} className={`schoolhub-card-hover rounded-[1.65rem] border-[#d8e5df] bg-white shadow-none ${feature.className ?? ''}`}>
                    <CardContent className="p-6">
                      <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf9f3] text-[#1d6d54]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold text-[#15313a]">{feature.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#526a70]">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </SurfaceFrame>
      </section>

      <section id="security" className="container-max py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="schoolhub-reveal">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-[#edf9f3] text-[#1d6d54]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-balance text-3xl font-bold tracking-normal sm:text-5xl">Security that matches multi-tenant reality.</h2>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-8 text-[#526a70]">
              The product treats school records, login identity, and active organization as separate concerns, so shared emails and multiple tenants stay predictable.
            </p>
          </div>
          <SurfaceFrame>
            <div className="grid gap-3 rounded-[calc(2rem-0.375rem)] bg-[#f7fbf8] p-5 sm:grid-cols-2">
              {['Tenant-isolated workspaces', 'Role-based permissions', 'Student credential reset', 'Organization selection', 'Audit-friendly workflows'].map((item) => (
                <div key={item} className="flex min-h-24 items-center gap-3 rounded-2xl border border-[#d8e5df] bg-white p-4">
                  <LockKeyhole className="h-5 w-5 text-[#1d6d54]" />
                  <span className="font-medium text-[#15313a]">{item}</span>
                </div>
              ))}
            </div>
          </SurfaceFrame>
        </div>
      </section>

      <section id="pricing" className="container-max py-20 lg:py-28">
        <div className="schoolhub-reveal max-w-2xl">
          <h2 className="text-balance text-3xl font-bold tracking-normal sm:text-5xl">Plans that match school rollout speed.</h2>
          <p className="mt-5 text-pretty text-lg leading-8 text-[#526a70]">
            Start with records and class operations, then expand as teachers and students move more workflows online.
          </p>
        </div>
        <div className="mt-12 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="schoolhub-card-hover rounded-[1.75rem] border-[#c7e4d7] bg-[#edf9f3] shadow-none">
            <CardContent className="grid gap-8 p-7 md:grid-cols-[0.88fr_1.12fr]">
              <div>
                <Badge className="border-[#c7e4d7] bg-white text-[#1d6d54]" variant="outline">
                  Most schools start here
                </Badge>
                <p className="mt-6 text-2xl font-bold text-[#15313a]">{plans[1].name}</p>
                <p className="mt-3 text-sm leading-6 text-[#526a70]">{plans[1].detail}</p>
                <p className="mt-7 font-mono text-5xl font-semibold text-[#15313a]">{plans[1].price}</p>
                <PrimaryCta to="/demo">Book Demo</PrimaryCta>
              </div>
              <div className="grid content-start gap-3">
                {plans[1].features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-2xl border border-[#c7e4d7] bg-white p-4 text-sm text-[#526a70]">
                    <Check className="h-4 w-4 text-[#1d6d54]" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-5">
            {[plans[0], plans[2]].map((plan) => (
              <Card key={plan.name} className="schoolhub-card-hover rounded-[1.75rem] border-[#d8e5df] bg-white/90 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-bold text-[#15313a]">{plan.name}</p>
                      <p className="mt-2 text-sm leading-6 text-[#526a70]">{plan.detail}</p>
                    </div>
                    <p className="font-mono text-2xl font-semibold text-[#15313a]">{plan.price}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {plan.features.map((feature) => (
                      <Badge key={feature} className="border-[#d8e5df] bg-[#f7fbf8] text-[#526a70]" variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container-max pb-20 lg:pb-28">
        <SurfaceFrame>
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#12343b] p-7 text-white lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-normal sm:text-5xl">
                  Bring the school day into one organized workspace.
                </h2>
                <p className="mt-5 max-w-2xl text-pretty leading-8 text-slate-300">
                  Start with users, classes, attendance, assignments, and student access. Expand when the school is ready.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group rounded-full bg-[#8bd8bd] pl-6 pr-2 text-[#12343b] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#a6e4cf] active:scale-[0.98]">
                  <Link to="/demo">
                    <span>Book Demo</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#12343b]/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-white/20 bg-transparent text-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/10 hover:text-white active:scale-[0.98]">
                  <Link to="/auth/login">Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </SurfaceFrame>
      </section>

      <footer className="border-t border-[#d8e5df] bg-white/72 py-12">
        <div className="container-max grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <SchoolHubLogo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-[#526a70]">SchoolHub for modern learning organizations.</p>
            <div className="mt-5 flex gap-2">
              <Bell className="h-5 w-5 text-[#1d6d54]" />
              <CalendarDays className="h-5 w-5 text-[#1d6d54]" />
              <Users className="h-5 w-5 text-[#1d6d54]" />
            </div>
          </div>
          {[
            ['Product', 'Platform', 'Attendance', 'Classes', 'Reports'],
            ['Company', 'Pricing', 'Demo', 'Contact'],
            ['Legal', 'Privacy', 'Terms'],
          ].map(([title, ...items]) => (
            <div key={title}>
              <p className="font-bold text-[#15313a]">{title}</p>
              <div className="mt-4 space-y-3">
                {items.map((item) =>
                  item === 'Pricing' ? (
                    <a key={item} href="/#pricing" className="block text-sm text-[#526a70] hover:text-[#15313a]">
                      {item}
                    </a>
                  ) : (
                    <Link key={item} to="/demo" className="block text-sm text-[#526a70] hover:text-[#15313a]">
                      {item}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </main>
  )
}
