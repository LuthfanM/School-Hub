import { Link, createFileRoute } from '@tanstack/react-router'
import { Button } from '@schoolhub/ui/components/button'
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'

const navItems = ['Platform', 'Solutions', 'Pricing', 'Security']

const problemCards = [
  {
    title: 'Scattered data',
    description:
      'Student records, grades, and attendance are hard to track when every team uses different tools.',
  },
  {
    title: 'Manual reporting',
    description:
      'Admins and teachers spend too much time preparing reports instead of supporting students.',
  },
  {
    title: 'Poor visibility',
    description:
      'School leaders cannot quickly see class progress, teacher workload, or student issues.',
  },
]

const features = [
  {
    title: 'Admin Console',
    description:
      'Manage students, teachers, classes, academic years, and school settings from one central place.',
    icon: Users,
    className: 'md:col-span-2',
  },
  {
    title: 'Teacher Workspace',
    description:
      'Take attendance, create assignments, record grades, and monitor student progress.',
    icon: BookOpen,
  },
  {
    title: 'Student Portal',
    description:
      'Students can view lessons, assignments, grades, announcements, and progress.',
    icon: GraduationCap,
  },
  {
    title: 'Parent Updates',
    description:
      'Parents receive updates about attendance, performance, announcements, and school activities.',
    icon: MessageCircle,
  },
  {
    title: 'Reports & Insights',
    description:
      'Track attendance trends, class performance, pending tasks, and school activity.',
    icon: BarChart3,
    className: 'md:col-span-2',
  },
]

const roles = [
  ['Admin', 'Control users, classes, reports, school settings, and academic structure.'],
  ['Teacher', 'Manage attendance, assignments, lessons, grading, and student progress.'],
  ['Student', 'View tasks, grades, announcements, schedules, and learning progress.'],
  ['Parent', 'Stay informed about attendance, school updates, academic progress, and messages.'],
]

const plans = [
  {
    name: 'Starter',
    detail: 'For small schools or tutoring centers.',
    price: '$79',
    features: ['Up to 100 students', 'Basic attendance', 'Class management', 'Teacher accounts'],
  },
  {
    name: 'School',
    detail: 'For active schools.',
    price: '$249',
    features: ['Up to 1,000 students', 'Assignments', 'Grades', 'Reports', 'Parent communication'],
    featured: true,
  },
  {
    name: 'Enterprise',
    detail: 'For large schools or school groups.',
    price: 'Custom',
    features: ['Unlimited students', 'Advanced reports', 'Custom integrations', 'Dedicated support'],
  },
]

function DashboardMockup() {
  return (
    <div className="rounded-[28px] border border-[#E5DED3] bg-white p-3 shadow-2xl shadow-stone-300/50">
      <div className="overflow-hidden rounded-[22px] border border-[#E5DED3] bg-[#F7F4EE]">
        <div className="flex items-center justify-between border-b border-[#E5DED3] bg-white px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-[#151515]">School overview</p>
            <p className="text-xs text-[#6F6A62]">Wednesday, 17 June</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-[#F7F4EE] px-3 py-2 text-xs text-[#6F6A62]">
            <Search className="h-3.5 w-3.5" />
            Search
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {[
            ['Attendance today', '94.2%', '32 absent', 'bg-[#EAF8EF] text-[#16A34A]'],
            ['Total students', '1,248', '+12 this month', 'bg-[#EAF1FF] text-[#2563EB]'],
            ['Active classes', '42', '8 running now', 'bg-[#FFF4D6] text-[#B45309]'],
            ['Pending assignments', '18', 'Need review', 'bg-[#FEECEC] text-[#DC2626]'],
          ].map(([label, value, meta, color]) => (
            <div key={label} className="rounded-2xl border border-[#E5DED3] bg-white p-4">
              <p className="text-xs text-[#6F6A62]">{label}</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="font-mono text-2xl font-semibold text-[#151515]">{value}</p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${color}`}>{meta}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 px-4 pb-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[#E5DED3] bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-[#151515]">Student progress</p>
              <span className="text-xs text-[#16A34A]">+8.4%</span>
            </div>
            <div className="flex h-32 items-end gap-2">
              {[58, 72, 65, 84, 78, 91].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl bg-[#2563EB]" style={{ height: `${height}%` }} />
                  <span className="text-[11px] text-[#9A948A]">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {['Upcoming exams', 'Parent messages', 'Teacher coordination'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-[#E5DED3] bg-white p-4">
                <div>
                  <p className="text-sm font-semibold text-[#151515]">{item}</p>
                  <p className="text-xs text-[#6F6A62]">{index + 2} items today</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#9A948A]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <main className="min-h-screen bg-[#F7F4EE] text-[#151515]">
      <nav className="sticky top-0 z-50 border-b border-[#E5DED3]/80 bg-[#F7F4EE]/90 backdrop-blur">
        <div className="container-max flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#151515] text-sm font-bold text-white">C</span>
            <span>
              <span className="block text-xl font-bold leading-none">SchoolHub</span>
              <span className="text-xs font-medium text-[#6F6A62]">School Hub</span>
            </span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-[#6F6A62] lg:flex">
            {navItems.map((item) => (
              <a key={item} href={`/#${item.toLowerCase()}`} className="hover:text-[#151515]">
                {item}
              </a>
            ))}
            <Link to="/demo" className="hover:text-[#151515]">Demo</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth/login" className="hidden text-sm font-semibold text-[#6F6A62] hover:text-[#151515] sm:inline">
              Login
            </Link>
            <Button asChild>
              <Link to="/demo">Book Demo</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="container-max grid items-center gap-12 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E5DED3] bg-white px-4 py-2 text-sm font-medium text-[#6F6A62]">
            <Sparkles className="h-4 w-4 text-[#F59E0B]" />
            Modern school management platform
          </div>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight text-[#151515] sm:text-6xl lg:text-7xl">
            Run your school from one calm dashboard.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6F6A62]">
            SchoolHub helps schools manage classes, attendance, grades, assignments, students, teachers, and parent communication without switching between spreadsheets, paper forms, and chat groups.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/demo">Book a Demo <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/dashboard">View Dashboard Preview</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm font-medium text-[#6F6A62]">
            Built for schools, bootcamps, academies, and tutoring centers.
          </p>
        </div>
        <DashboardMockup />
      </section>

      <section id="platform" className="container-max py-16 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563EB]">Problem</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            School operations should not live in five different places.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#6F6A62]">
            Attendance in paper books, grades in spreadsheets, assignments in chat groups, payment reminders in another app, and parent communication everywhere. SchoolHub brings the daily workflow into one organized system.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {problemCards.map((card) => (
            <div key={card.title} className="rounded-[24px] border border-[#E5DED3] bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/30">
              <div className="mb-6 h-2 w-16 rounded-full bg-[#2563EB]" />
              <h3 className="text-xl font-bold">{card.title}</h3>
              <p className="mt-3 leading-7 text-[#6F6A62]">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="bg-[#111827] py-16 text-white lg:py-24">
        <div className="container-max">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#93C5FD]">Solution</p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                One workspace for every school role.
              </h2>
            </div>
            <Button asChild variant="secondary">
              <Link to="/dashboard">Open Dashboard</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className={`rounded-[24px] border border-white/10 bg-white/[0.06] p-7 ${feature.className ?? ''}`}>
                  <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#2563EB]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container-max py-16 lg:py-24">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2563EB]">Dashboard</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Designed for real school workflows.</h2>
          <p className="mt-5 text-lg leading-8 text-[#6F6A62]">
            SchoolHub gives each role a focused dashboard, so admins, teachers, and students only see what matters to them.
          </p>
        </div>
        <div className="rounded-[28px] border border-[#E5DED3] bg-white p-4 shadow-xl shadow-stone-300/30">
          <div className="grid gap-4 rounded-[22px] bg-[#F7F4EE] p-4 lg:grid-cols-[220px_1fr]">
            <aside className="rounded-[18px] bg-[#111827] p-4 text-white">
              <p className="mb-5 text-lg font-bold">SchoolHub</p>
              {['Overview', 'Students', 'Teachers', 'Classes', 'Attendance', 'Assignments', 'Grades', 'Messages', 'Reports', 'Settings'].map((item, index) => {
                const className = `mb-1 flex items-center rounded-xl px-3 py-2 text-sm ${index === 0 ? 'bg-[#2563EB]' : 'text-slate-300 hover:bg-white/10'}`

                return index === 0 ? (
                  <Link key={item} to="/dashboard" className={className}>
                    {item}
                  </Link>
                ) : (
                  <Link key={item} to="/dashboard/$section" params={{ section: item.toLowerCase() }} className={className}>
                    {item}
                  </Link>
                )
              })}
            </aside>
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 rounded-[18px] bg-white p-5 md:flex-row md:items-center">
                <div>
                  <p className="text-2xl font-bold">Good morning, Admin</p>
                  <p className="text-[#6F6A62]">Manage daily school activity, attendance, and academic progress.</p>
                </div>
                <Button asChild>
                  <Link to="/dashboard/students/new">Add Student</Link>
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {['1,248 students', '94.2% attendance', '42 classes', '18 tasks'].map((stat) => (
                  <div key={stat} className="rounded-2xl bg-white p-5">
                    <p className="font-mono text-2xl font-semibold">{stat.split(' ')[0]}</p>
                    <p className="text-sm text-[#6F6A62]">{stat.replace(stat.split(' ')[0], '').trim()}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-5">
                  <p className="font-bold">Attendance Overview</p>
                  <div className="mt-5 flex h-36 items-end gap-3">
                    {[78, 89, 84, 94, 91, 88].map((height) => (
                      <div key={height} className="flex-1 rounded-t-xl bg-[#2563EB]" style={{ height: `${height}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-5">
                  <p className="font-bold">Class Performance</p>
                  {['Grade 7A', 'Grade 8B', 'Grade 9C', 'Grade 10A'].map((grade, index) => (
                    <div key={grade} className="mt-4">
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{grade}</span>
                        <span>{88 - index * 4}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E5DED3]">
                        <div className="h-2 rounded-full bg-[#16A34A]" style={{ width: `${88 - index * 4}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-max py-16 lg:py-24">
        <h2 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Built for admins, teachers, students, and parents.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-4">
          {roles.map(([role, description]) => (
            <Link key={role} to="/dashboard" className="rounded-[24px] border border-[#E5DED3] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/30">
              <p className="text-xl font-bold">{role}</p>
              <p className="mt-3 text-sm leading-6 text-[#6F6A62]">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="security" className="container-max py-16 lg:py-24">
        <div className="rounded-[28px] bg-white p-8 shadow-xl shadow-stone-300/30 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <ShieldCheck className="mb-5 h-12 w-12 text-[#2563EB]" />
              <h2 className="text-4xl font-bold tracking-tight">Secure by design for school data.</h2>
              <p className="mt-5 leading-8 text-[#6F6A62]">
                SchoolHub is designed with tenant isolation, role-based access, and clear permission boundaries so each school controls its own data.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {['Tenant-isolated workspaces', 'Role-based permissions', 'Secure authentication', 'Audit-friendly activity history', 'Data access control'].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#E5DED3] bg-[#F7F4EE] p-4">
                  <LockKeyhole className="h-5 w-5 text-[#2563EB]" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="container-max py-16 lg:py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple pricing for growing schools.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[#6F6A62]">Choose a calm operating system for your current school size and expand when your workflows grow.</p>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-[24px] border p-7 ${plan.featured ? 'border-[#2563EB] bg-[#EAF1FF]' : 'border-[#E5DED3] bg-white'}`}>
              <p className="text-xl font-bold">{plan.name}</p>
              <p className="mt-2 text-sm text-[#6F6A62]">{plan.detail}</p>
              <p className="mt-6 font-mono text-4xl font-semibold">{plan.price}</p>
              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-[#16A34A]" />
                    {feature}
                  </div>
                ))}
              </div>
              <Button asChild className="mt-7 w-full" variant={plan.featured ? 'default' : 'secondary'}>
                <Link to="/demo">Book a Demo</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="container-max pb-16 lg:pb-24">
        <div className="rounded-[32px] bg-[#2563EB] p-8 text-white lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Bring your school operations into one modern system.
              </h2>
              <p className="mt-5 max-w-2xl leading-8 text-blue-50">
                Start with attendance, classes, students, and teachers. Add reports, parent communication, and deeper workflows as your school grows.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/demo">Book a Demo</Link>
              </Button>
              <Button asChild size="lg" className="bg-[#111827] text-white hover:bg-[#111827]/90">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5DED3] bg-white py-12">
        <div className="container-max grid gap-8 md:grid-cols-4">
          {[
            ['Product', 'Platform', 'Attendance', 'Classes', 'Reports', 'Parent Portal'],
            ['Company', 'About', 'Pricing', 'Demo', 'Contact'],
            ['Resources', 'Help Center', 'Documentation', 'Security', 'Privacy'],
          ].map(([title, ...items]) => (
            <div key={title}>
              <p className="font-bold">{title}</p>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  item === 'Pricing' ? (
                    <a key={item} href="/#pricing" className="block text-sm text-[#6F6A62] hover:text-[#151515]">
                      {item}
                    </a>
                  ) : (
                    <Link key={item} to="/demo" className="block text-sm text-[#6F6A62] hover:text-[#151515]">
                      {item}
                    </Link>
                  )
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="text-xl font-bold">SchoolHub</p>
            <p className="mt-4 text-sm leading-6 text-[#6F6A62]">SchoolHub for modern learning organizations.</p>
            <div className="mt-5 flex gap-2">
              <Bell className="h-5 w-5 text-[#2563EB]" />
              <CalendarDays className="h-5 w-5 text-[#F59E0B]" />
              <Users className="h-5 w-5 text-[#16A34A]" />
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
