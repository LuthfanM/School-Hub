import { Link, useRouterState } from '@tanstack/react-router'
import { Separator } from '@schoolhub/ui/components/separator'
import { HelpCircle, LogOut } from 'lucide-react'

import { getScreensForRole } from '../../lib/role-access'
import { useDashboardRole } from '../../lib/role-context'
import { colors, dashboardColors } from '../../styles/colors'

export function DashboardSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { role } = useDashboardRole()
  const navItems = getScreensForRole(role)
  const activeSection = pathname.startsWith('/dashboard/')
    ? pathname.split('/')[2]
    : 'overview'

  return (
    <aside className={`flex min-h-screen flex-col justify-between border-r p-4 ${dashboardColors.card}`}>
      <div>
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <span className={`grid h-10 w-10 place-items-center rounded-2xl text-sm font-bold text-white ${colors.app.dark}`}>C</span>
          <span>
            <span className="block text-xl font-bold leading-none">SchoolHub</span>
            <span className={`text-xs ${colors.app.muted}`}>School Hub</span>
          </span>
        </Link>
        <Separator className={`mb-4 ${colors.app.borderBg}`} />
        <nav className="space-y-1">
          {navItems.map(({ section, label, icon: Icon }) => (
            <Link
              key={label}
              to={section === 'overview' ? '/dashboard' : '/dashboard/$section'}
              params={section === 'overview' ? undefined : { section }}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                section === activeSection
                  ? dashboardColors.activeNav
                  : dashboardColors.inactiveNav
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="space-y-1">
        <Separator className={`mb-3 ${colors.app.borderBg}`} />
        <Link
          to={role === 'platform_admin' ? '/dashboard/$section' : '/demo'}
          params={role === 'platform_admin' ? { section: 'platform-settings' } : undefined}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${dashboardColors.inactiveNav}`}
        >
          <HelpCircle className="h-4 w-4" />
          Help center
        </Link>
        <Link to="/auth/login" className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${dashboardColors.inactiveNav}`}>
          <LogOut className="h-4 w-4" />
          Logout
        </Link>
      </div>
    </aside>
  )
}
