import { Link } from '@tanstack/react-router'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@schoolhub/ui/components/table'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  LockKeyhole,
  MailPlus,
  PlugZap,
  Search,
  Settings2,
  ShieldCheck,
} from 'lucide-react'
import { colors, dashboardColors } from '../../styles/colors'

const tenantRows = [
  ['Al Hikmah School', 'al-hikmah', 'active', 'admin@alhikmah.sch.id', '128 members', '2 hours ago'],
  ['Nusantara Academy', 'nusantara-academy', 'pending_setup', 'owner@nusantara.edu', 'Awaiting admin', '1 day ago'],
  ['Bina Insan Program', 'bina-insan', 'suspended', 'ops@binainsan.org', '42 members', '5 days ago'],
  ['Cendekia Learning', 'cendekia', 'active', 'admin@cendekia.id', '76 members', 'Today'],
]

const setupQueue = [
  ['Nusantara Academy', 'Invite first organization admin', 'pending_setup'],
  ['Harapan Bangsa', 'Confirm custom domain', 'pending_setup'],
  ['Bina Insan Program', 'Review suspension reason', 'suspended'],
]

const settingsGroups = [
  {
    title: 'Tenant onboarding',
    icon: Building2,
    items: [
      ['Default tenant status', 'Pending setup'],
      ['First admin provisioning', 'Invite-only'],
      ['Self-registration', 'Disabled'],
    ],
  },
  {
    title: 'Auth and security',
    icon: LockKeyhole,
    items: [
      ['Email/password login', 'Enabled'],
      ['Session provider', 'Better Auth'],
      ['Support access', 'Explicit grant required'],
    ],
  },
  {
    title: 'Billing readiness',
    icon: PlugZap,
    items: [
      ['Billing provider', 'Not connected'],
      ['Plan catalog', 'Planned'],
      ['Trial duration', 'Not configured'],
    ],
  },
]

export function PlatformTenantsScreen() {
  return (
    <div className="space-y-6">
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>Platform</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Tenants</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
                Create school workspaces, invite the first organization admin, and manage tenant status without opening tenant-private academic data.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild>
                <Link to="/demo"><Building2 className="h-4 w-4" /> Create Tenant</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/demo"><MailPlus className="h-4 w-4" /> Invite Admin</Link>
              </Button>
            </div>
          </div>

          <div className="relative mt-8">
            <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
            <Input className={`h-12 rounded-full pl-10 ${dashboardColors.panel}`} placeholder="Search tenants by school, slug, or admin email" />
          </div>

          <div className={`mt-6 overflow-hidden rounded-2xl border ${colors.app.border}`}>
            <Table>
              <TableHeader className={dashboardColors.tableHeader}>
                <TableRow>
                  {['Organization', 'Slug', 'Status', 'First admin', 'Usage', 'Last activity', 'Action'].map((head) => (
                    <TableHead key={head} className="font-semibold">{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenantRows.map(([name, slug, status, admin, usage, activity]) => (
                  <TableRow key={slug} className={`${colors.app.border} ${colors.app.backgroundHover}`}>
                    <TableCell className="font-semibold">{name}</TableCell>
                    <TableCell className={`font-mono text-sm ${colors.app.muted}`}>{slug}</TableCell>
                    <TableCell><TenantStatus status={status} /></TableCell>
                    <TableCell className={colors.app.muted}>{admin}</TableCell>
                    <TableCell>{usage}</TableCell>
                    <TableCell className={colors.app.muted}>{activity}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="secondary">
                        <Link to="/demo">Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className={`rounded-[24px] ${dashboardColors.card}`}>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <CircleAlert className={`h-5 w-5 ${colors.warning.icon}`} />
            <p className="text-lg font-bold">Operational setup queue</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {setupQueue.map(([name, task, status]) => (
              <Link key={name} to="/demo" className={`rounded-2xl border p-4 transition ${dashboardColors.panel} ${colors.brand.hoverBg}`}>
                <TenantStatus status={status} />
                <p className="mt-3 font-semibold">{name}</p>
                <p className={`mt-1 text-sm ${colors.app.muted}`}>{task}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PlatformSettingsScreen() {
  return (
    <div className="space-y-6">
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>Platform</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Platform Settings</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
                Global SaaS configuration for onboarding, authentication, operational safety, and future billing.
              </p>
            </div>
            <Badge className={colors.warning.badge}>Read-only placeholder</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {settingsGroups.map(({ title, icon: Icon, items }) => (
          <Card key={title} className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${colors.brand.icon}`} />
                <p className="text-lg font-bold">{title}</p>
              </div>
              <div className="space-y-4">
                {items.map(([label, value]) => (
                  <div key={label} className={`flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0 ${colors.app.border}`}>
                    <span className={`text-sm ${colors.app.muted}`}>{label}</span>
                    <span className="text-right text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={`rounded-[24px] ${dashboardColors.card}`}>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${dashboardColors.panel}`}>
            <div className="mb-3 flex items-center gap-3">
              <ShieldCheck className={`h-5 w-5 ${colors.success.icon}`} />
              <p className="font-bold">Operational boundary</p>
            </div>
            <p className={`text-sm leading-6 ${colors.app.muted}`}>
              Platform settings do not grant tenant academic data access. Support access must be explicit, audited, and time-bound later.
            </p>
          </div>
          <div className={`rounded-2xl border p-5 ${dashboardColors.panel}`}>
            <div className="mb-3 flex items-center gap-3">
              <KeyRound className={`h-5 w-5 ${colors.brand.icon}`} />
              <p className="font-bold">Environment</p>
            </div>
            <div className={`space-y-2 text-sm ${colors.app.muted}`}>
              <p>API URL: configured by environment</p>
              <p>Web URL: configured by environment</p>
              <p>Database: PostgreSQL via Prisma</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TenantStatus({ status }: { status: string }) {
  if (status === 'active') {
    return <Badge className={colors.success.badge}><CheckCircle2 className="h-3 w-3" /> Active</Badge>
  }

  if (status === 'suspended') {
    return <Badge className={colors.danger.badge}><AlertTriangle className="h-3 w-3" /> Suspended</Badge>
  }

  return <Badge className={colors.warning.badge}><Settings2 className="h-3 w-3" /> Pending setup</Badge>
}
