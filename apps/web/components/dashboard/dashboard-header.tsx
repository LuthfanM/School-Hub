import { Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback } from '@schoolhub/ui/components/avatar'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@schoolhub/ui/components/dropdown-menu'
import { Input } from '@schoolhub/ui/components/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@schoolhub/ui/components/tooltip'
import { Bell, Search } from 'lucide-react'

import { roles, type RoleId } from '../../lib/role-access'
import { useDashboardRole } from '../../lib/role-context'
import { colors, dashboardColors } from '../../styles/colors'
import { DashboardLogoutButton } from './dashboard-logout-button'

interface DashboardHeaderProps {
  subtitle: string
  title: string
}

export function DashboardHeader({ subtitle, title }: DashboardHeaderProps) {
  const { isSessionRole, role, setRole } = useDashboardRole()
  const searchPlaceholder = role === 'platform_admin'
    ? 'Search tenants, admins'
    : role === 'student'
      ? 'Search courses, lessons'
      : 'Search students, classes'

  return (
    <header className={`mb-6 flex flex-col justify-between gap-4 rounded-[2rem] border p-5 lg:flex-row lg:items-center ${dashboardColors.card}`}>
      <div>
        <Badge className={`mb-3 ${colors.brand.badge}`}>{roles[role].badge}</Badge>
        <p className="text-3xl font-bold tracking-tight">{title}</p>
        <p className={`mt-1 max-w-2xl ${colors.app.muted}`}>{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className={`h-11 rounded-full border bg-white/82 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70 ${colors.app.border} ${colors.app.foreground}`}
          disabled={isSessionRole}
          onChange={(event) => setRole(event.target.value as RoleId)}
          title={isSessionRole ? 'Role is resolved from your session membership' : 'Local role preview'}
          value={role}
        >
          {Object.values(roles).map((roleOption) => (
            <option key={roleOption.id} value={roleOption.id}>
              {roleOption.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
          <Input className={`h-11 rounded-full border-[#d8e5df] bg-white/82 pl-10`} placeholder={searchPlaceholder} />
        </div>
        {role === 'owner' || role === 'admin' ? (
          <Button asChild className="rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]">
            <Link to="/dashboard/students/new">Add Student</Link>
          </Button>
        ) : null}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/dashboard/$section" params={{ section: role === 'platform_admin' ? 'platform-tenants' : role === 'student' ? 'my-progress' : 'messages' }} className={`grid h-11 w-11 place-items-center rounded-full border border-[#d8e5df] bg-white/82 transition hover:bg-[#edf9f3]`}>
                <Bell className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Relevant updates</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`rounded-full outline-none focus:ring-2 ${dashboardColors.focusAvatar}`}>
              <Avatar>
                <AvatarFallback className={`${colors.app.darkAlt} text-white`}>SH</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{roles[role].label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/$section" params={{ section: role === 'platform_admin' ? 'platform-settings' : role === 'student' ? 'my-progress' : 'settings' }}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              <DashboardLogoutButton className="w-full text-left text-sm" compact />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
