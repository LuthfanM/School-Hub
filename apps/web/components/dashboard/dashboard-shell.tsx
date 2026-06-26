import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'

import { useSession } from '../../lib/auth-client'
import {
  canAccessScreen,
  normalizeSection,
  roles,
  type RoleId,
} from '../../lib/role-access'
import { DashboardRoleContext } from '../../lib/role-context'
import { DashboardOverview } from './dashboard-overview'
import { DashboardSidebar } from './dashboard-sidebar'

interface DashboardShellProps {
  initialPlatformRole: string
}

export function DashboardShell({ initialPlatformRole }: DashboardShellProps) {
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
  const role: RoleId = sessionPlatformRole === 'platform_admin' ? 'platform_admin' : demoRole
  const isOverview = pathname === '/dashboard'

  useEffect(() => {
    window.localStorage.setItem('schoolhub.dashboard.role', demoRole)
  }, [demoRole])

  useEffect(() => {
    if (pathname === '/dashboard') return

    const section = normalizeSection(pathname.split('/')[2])
    if (!section || canAccessScreen(role, section)) return

    const defaultSection = roles[role].defaultSection

    if (defaultSection === 'overview') {
      void navigate({ to: '/dashboard' })
      return
    }

    void navigate({
      to: '/dashboard/$section',
      params: { section: defaultSection },
    })
  }, [navigate, pathname, role])

  return (
    <DashboardRoleContext.Provider value={{ role, setRole: setDemoRole }}>
      <main className="min-h-screen bg-[#F7F4EE] text-[#151515]">
        <div className="grid lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <DashboardSidebar />
          </div>
          {isOverview ? <DashboardOverview /> : <Outlet />}
        </div>
      </main>
    </DashboardRoleContext.Provider>
  )
}
