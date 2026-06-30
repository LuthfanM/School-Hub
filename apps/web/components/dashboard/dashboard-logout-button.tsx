import { useState, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

import { signOut } from '../../lib/auth-client'
import { apiRequest } from '../../lib/api'
import { dashboardColors } from '../../styles/colors'

interface DashboardLogoutButtonProps {
  children?: ReactNode
  className?: string
  compact?: boolean
}

export function DashboardLogoutButton({
  children = 'Logout',
  className,
  compact = false,
}: DashboardLogoutButtonProps) {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await signOut()
      await apiRequest('/api/student-auth/logout', { method: 'POST' }).catch(() => null)
    } finally {
      window.localStorage.removeItem('schoolhub.dashboard.role')
      await navigate({ to: '/auth/login', replace: true })
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      className={className ?? `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium ${dashboardColors.inactiveNav}`}
      disabled={isLoggingOut}
      onClick={() => void handleLogout()}
      type="button"
    >
      {compact ? null : <LogOut className="h-4 w-4" />}
      {isLoggingOut ? 'Logging out...' : children}
    </button>
  )
}
