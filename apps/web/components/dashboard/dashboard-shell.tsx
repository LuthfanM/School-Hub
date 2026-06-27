import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'

import { useSession } from '../../lib/auth-client'
import {
  canAccessScreen,
  normalizeSection,
  roles,
  type RoleId,
} from '../../lib/role-access'
import { DashboardRoleContext, type ActiveOrganization } from '../../lib/role-context'
import { dashboardColors } from '../../styles/colors'
import { DashboardOverview } from './dashboard-overview'
import { DashboardSidebar } from './dashboard-sidebar'

interface DashboardShellProps {
  initialActiveOrganization: ActiveOrganization | null
  initialActiveMembershipRole: string | null
  initialActivePermissions: Array<{
    resource: string
    action: string
  }>
  initialPlatformRole: string
}

export function DashboardShell({
  initialActiveOrganization,
  initialActiveMembershipRole,
  initialActivePermissions,
  initialPlatformRole,
}: DashboardShellProps) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { data: session } = useSession()
  const [demoRole, setDemoRole] = useState<RoleId>(() => {
    if (typeof window === 'undefined') return 'admin'

    const storedRole = window.localStorage.getItem('schoolhub.dashboard.role')
    return storedRole && storedRole in roles ? (storedRole as RoleId) : 'admin'
  })
  const sessionPlatformRole = (session?.user as { platformRole?: string } | undefined)?.platformRole
    ?? initialPlatformRole
  const sessionOrgRole = isRoleId(initialActiveMembershipRole)
    ? initialActiveMembershipRole
    : null
  const role: RoleId = sessionPlatformRole === 'platform_admin'
    ? 'platform_admin'
    : sessionOrgRole ?? demoRole
  const isSessionRole = sessionPlatformRole === 'platform_admin' || Boolean(sessionOrgRole)
  const isOverview = pathname === '/dashboard'

  useEffect(() => {
    window.localStorage.setItem('schoolhub.dashboard.role', demoRole)
  }, [demoRole])

  useEffect(() => {
    if (pathname === '/dashboard') return

    const section = normalizeSection(pathname.split('/')[2])
    if (!section || canAccessScreen(role, section, initialActivePermissions)) return

    const defaultSection = roles[role].defaultSection

    if (defaultSection === 'overview') {
      void navigate({ to: '/dashboard' })
      return
    }

    void navigate({
      to: '/dashboard/$section',
      params: { section: defaultSection },
    })
  }, [initialActivePermissions, navigate, pathname, role])

  return (
    <DashboardRoleContext.Provider
      value={{
        activeOrganization: initialActiveOrganization,
        activePermissions: initialActivePermissions,
        isSessionRole,
        role,
        setRole: setDemoRole,
      }}
    >
      <main className={`h-screen overflow-hidden ${dashboardColors.page}`}>
        <div className="grid h-full lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden lg:block">
            <DashboardSidebar />
          </div>
          <div className="h-full min-w-0 overflow-y-auto">
            {isOverview ? <DashboardOverview /> : <Outlet />}
          </div>
        </div>
      </main>
    </DashboardRoleContext.Provider>
  )
}

function isRoleId(value: string | null): value is RoleId {
  return Boolean(value && value in roles)
}
