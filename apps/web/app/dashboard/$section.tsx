import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { Input } from '@schoolhub/ui/components/input'
import { Skeleton } from '@schoolhub/ui/components/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@schoolhub/ui/components/tabs'
import { ArrowLeft, CircleAlert, Filter, Plus, Search } from 'lucide-react'
import {
  canAccessScreen,
  normalizeSection,
  roles,
  screens,
} from '../../lib/role-access'
import { useDashboardRole } from '../../lib/role-context'
import { PlatformSettingsScreen, PlatformTenantsScreen } from '../../components/dashboard/platform-screens'
import { colors, dashboardColors } from '../../styles/colors'

export const Route = createFileRoute('/dashboard/$section')({
  component: DashboardSectionPage,
})

function DashboardSectionPage() {
  const { section } = Route.useParams()
  const { role } = useDashboardRole()
  const normalizedSection = normalizeSection(section)
  const screen = normalizedSection ? screens[normalizedSection] : null
  const title = screen?.label ?? 'Unknown Section'
  const isBilling = normalizedSection === 'billing'
  const hasAccess = normalizedSection ? canAccessScreen(role, normalizedSection) : false
  const isPlatformTenants = normalizedSection === 'platform-tenants'
  const isPlatformSettings = normalizedSection === 'platform-settings'

  return (
    <main className={`min-h-full w-full p-4 sm:p-8 ${dashboardColors.page}`}>
      <div className="w-full">
        <Link to="/dashboard" className={`mb-5 inline-flex items-center gap-2 text-sm font-semibold ${colors.app.muted} ${colors.app.foregroundHover}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        {!hasAccess ? (
          <RestrictedSection
            roleLabel={roles[role].label}
            sectionTitle={title}
          />
        ) : null}
        {hasAccess && isPlatformTenants ? <PlatformTenantsScreen /> : null}
        {hasAccess && isPlatformSettings ? <PlatformSettingsScreen /> : null}
        {hasAccess ? (
        !isPlatformTenants && !isPlatformSettings ? (
        <Card className={`rounded-[28px] ${dashboardColors.card}`}>
          <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>{roles[role].badge}</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
                {screen?.description ?? 'This route is not described yet.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link to="/dashboard/$section" params={{ section: 'reports' }}><Filter className="h-4 w-4" /> Filter</Link>
              </Button>
              {normalizedSection === 'students' || normalizedSection === 'classes' || normalizedSection === 'assignments' ? (
                <Button asChild>
                  <Link to={normalizedSection === 'students' ? '/dashboard/students/new' : '/demo'}>
                  <Plus className="h-4 w-4" />
                  Add {title.slice(0, -1) || title}
                </Link>
                </Button>
              ) : null}
            </div>
          </div>

          {isBilling ? (
            <Card className={`mt-8 rounded-[24px] border ${colors.app.border} ${colors.warning.subtleBg}`}>
              <CardContent className="p-6">
              <CircleAlert className={`mb-4 h-8 w-8 ${colors.warning.icon}`} />
              <h2 className="text-xl font-bold">You do not have permission to view billing settings.</h2>
              <p className={`mt-2 ${colors.app.muted}`}>Contact your school admin to request billing access.</p>
              <Button asChild className="mt-5">
                <Link to="/dashboard">Return to Dashboard</Link>
              </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative mt-8">
                <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
                <Input className={`h-12 rounded-full pl-10 ${dashboardColors.panel}`} placeholder={`Search ${title.toLowerCase()}`} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {['Active', 'Pending review', 'Completed'].map((status, index) => (
                  <Link key={status} to="/dashboard" className={`rounded-[24px] border p-5 transition hover:-translate-y-1 ${dashboardColors.panel} ${colors.brand.hoverBg}`}>
                    <p className="font-mono text-3xl font-semibold">{[128, 18, 94][index]}</p>
                    <Badge className="mt-2" variant={index === 1 ? 'warning' : 'secondary'}>{status}</Badge>
                    <p className={`mt-2 text-sm leading-6 ${colors.app.muted}`}>Open the overview to inspect details and next steps.</p>
                  </Link>
                ))}
              </div>
              <Tabs defaultValue="empty" className="mt-6">
                <TabsList>
                  <TabsTrigger value="empty">Empty</TabsTrigger>
                  <TabsTrigger value="loading">Loading</TabsTrigger>
                </TabsList>
                <TabsContent value="empty" className={`rounded-[24px] border border-dashed p-8 text-center ${colors.app.borderDashed} ${colors.app.card}`}>
                  <h2 className="text-xl font-bold">No live {title.toLowerCase()} data connected yet.</h2>
                  <p className={`mx-auto mt-2 max-w-xl ${colors.app.muted}`}>
                    This is ready for API-backed data later. For now, use the buttons to confirm the screen flow.
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
                <TabsContent value="loading" className={`rounded-[24px] border p-8 ${dashboardColors.card}`}>
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
        ) : null
        ) : null}
      </div>
    </main>
  )
}

function RestrictedSection({
  roleLabel,
  sectionTitle,
}: {
  roleLabel: string
  sectionTitle: string
}) {
  return (
    <Card className={`rounded-[28px] ${dashboardColors.card}`}>
      <CardContent className="p-8">
        <CircleAlert className={`mb-5 h-10 w-10 ${colors.warning.icon}`} />
        <h1 className="text-3xl font-bold">Restricted screen</h1>
        <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
          {roleLabel} cannot access {sectionTitle}. This screen is hidden by role policy until the user has the correct organization role or explicit platform support access.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/dashboard">Return to allowed overview</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/demo">View demo flow</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
