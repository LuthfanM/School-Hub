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

interface DashboardHeaderProps {
  subtitle: string
  title: string
}

export function DashboardHeader({ subtitle, title }: DashboardHeaderProps) {
  const { role, setRole } = useDashboardRole()

  return (
    <header className="mb-6 flex flex-col justify-between gap-4 rounded-[24px] border border-[#E5DED3] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
      <div>
        <Badge className="mb-3 bg-[#EAF1FF] text-[#2563EB]">{roles[role].badge}</Badge>
        <p className="text-3xl font-bold tracking-tight">{title}</p>
        <p className="mt-1 max-w-2xl text-[#6F6A62]">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="h-11 rounded-full border border-[#E5DED3] bg-[#F7F4EE] px-4 text-sm font-semibold text-[#151515]"
          onChange={(event) => setRole(event.target.value as RoleId)}
          value={role}
        >
          {Object.values(roles).map((roleOption) => (
            <option key={roleOption.id} value={roleOption.id}>
              {roleOption.label}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search className="h-4 w-4" />
          <Input className="h-11 rounded-full border-[#E5DED3] bg-[#F7F4EE] pl-10" placeholder="Search students, classes" />
        </div>
        {role === 'admin' || role === 'teacher' ? (
          <Button asChild>
            <Link to="/dashboard/students/new">Add Student</Link>
          </Button>
        ) : null}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/dashboard/$section" params={{ section: role === 'platform_admin' ? 'platform-tenants' : role === 'student' ? 'my-progress' : 'messages' }} className="grid h-11 w-11 place-items-center rounded-full border border-[#E5DED3] bg-white">
                <Bell className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Relevant updates</TooltipContent>
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
            <DropdownMenuLabel>{roles[role].label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/$section" params={{ section: role === 'platform_admin' ? 'platform-settings' : role === 'student' ? 'my-progress' : 'settings' }}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/auth/login">Logout</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
