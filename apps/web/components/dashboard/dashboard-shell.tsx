import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'

import { useSession } from '../../lib/auth-client'
import { applyUserLanguagePreference } from '../../lib/language-preferences'
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
  initialLanguage: string
  initialPlatformRole: string
}

export function DashboardShell({
  initialActiveOrganization,
  initialActiveMembershipRole,
  initialActivePermissions,
  initialLanguage,
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
  const sessionLanguage = (session?.user as { language?: string } | undefined)?.language
    ?? initialLanguage
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
    void applyUserLanguagePreference(sessionLanguage)
  }, [sessionLanguage])

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
        organizationRole: sessionOrgRole,
        platformRole: sessionPlatformRole ?? 'user',
        role,
        setRole: setDemoRole,
      }}
    >
      <main className={`h-[100dvh] overflow-hidden ${dashboardColors.page}`}>
        <div className="grid h-full gap-4 p-3 lg:grid-cols-[292px_minmax(0,1fr)] lg:p-4">
          <div className="hidden lg:block">
            <DashboardSidebar />
          </div>
          <div className="h-full min-w-0 overflow-y-auto rounded-[2rem] border border-[#d8e5df] bg-white/54 shadow-[0_24px_70px_rgba(18,52,59,0.08)]">
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
