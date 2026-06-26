import { createContext, useContext } from 'react'
import type { RoleId } from './role-access'

interface DashboardRoleContextValue {
  role: RoleId
  setRole: (role: RoleId) => void
}

export const DashboardRoleContext = createContext<DashboardRoleContextValue | null>(null)

export function useDashboardRole() {
  const context = useContext(DashboardRoleContext)

  if (!context) {
    throw new Error('useDashboardRole must be used inside DashboardRoleContext.Provider')
  }

  return context
}
