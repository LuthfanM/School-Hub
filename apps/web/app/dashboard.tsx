import { Link, createFileRoute } from '@tanstack/react-router'
import { Avatar, AvatarFallback } from '@schoolhub/ui/components/avatar'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@schoolhub/ui/components/dropdown-menu'
import { Input } from '@schoolhub/ui/components/input'
import { Separator } from '@schoolhub/ui/components/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@schoolhub/ui/components/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@schoolhub/ui/components/tooltip'
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Users,
  WalletCards,
} from 'lucide-react'

const navItems = [
  ['Overview', undefined, Home],
  ['Students', 'students', Users],
  ['Teachers', 'teachers', GraduationCap],
  ['Classes', 'classes', BookOpen],
  ['Attendance', 'attendance', CheckCircle2],
  ['Assignments', 'assignments', ClipboardList],
  ['Grades', 'grades', BarChart3],
  ['Messages', 'messages', MessageSquare],
  ['Reports', 'reports', BarChart3],
  ['Billing', 'billing', WalletCards],
  ['Settings', 'settings', Settings],
] as const

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

function Sidebar() {
  return (
    <aside className="flex min-h-screen flex-col justify-between border-r border-[#E5DED3] bg-white p-4">
      <div>
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#151515] text-sm font-bold text-white">C</span>
          <span>
            <span className="block text-xl font-bold leading-none">SchoolHub</span>
            <span className="text-xs text-[#6F6A62]">School Hub</span>
          </span>
        </Link>
        <Separator className="mb-4 bg-[#E5DED3]" />
        <nav className="space-y-1">
          {navItems.map(([label, href, Icon]) => (
            <Link
              key={label}
              to={href ? '/dashboard/$section' : '/dashboard'}
              params={href ? { section: href } : undefined}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                label === 'Overview'
                  ? 'bg-[#EAF1FF] text-[#2563EB]'
                  : 'text-[#6F6A62] hover:bg-[#F7F4EE] hover:text-[#151515]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="space-y-1">
        <Separator className="mb-3 bg-[#E5DED3]" />
        <Link to="/dashboard/$section" params={{ section: 'settings' }} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#6F6A62] hover:bg-[#F7F4EE]">
          <HelpCircle className="h-4 w-4" />
          Help center
        </Link>
        <Link to="/auth/login" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-[#6F6A62] hover:bg-[#F7F4EE]">
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </aside>
  )
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#F7F4EE] text-[#151515]">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <section className="p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col justify-between gap-4 rounded-[24px] border border-[#E5DED3] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
            <div>
              <p className="text-3xl font-bold tracking-tight">Good morning, Admin</p>
              <p className="mt-1 text-[#6F6A62]">Manage daily school activity, attendance, and academic progress.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="h-4 w-4" />
                <Input className="h-11 rounded-full border-[#E5DED3] bg-[#F7F4EE] pl-10" placeholder="Search students, classes" />
              </div>
              <Button asChild>
                <Link to="/dashboard/students/new">Add Student</Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/dashboard/$section" params={{ section: 'messages' }} className="grid h-11 w-11 place-items-center rounded-full border border-[#E5DED3] bg-white">
                      <Bell className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>Recent messages</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2">
                    <Avatar>
                      <AvatarFallback className="bg-[#111827] text-white">AD</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Admin account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/$section" params={{ section: 'settings' }}>Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/auth/login">Logout</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

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
        </section>
      </div>
    </main>
  )
}
