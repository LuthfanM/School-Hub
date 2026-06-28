import { createContext, useContext } from 'react'
import type { RoleId } from './role-access'

export interface ActiveOrganization {
  id: string
  name: string
  slug: string
  status: string
}

export interface ActivePermission {
  resource: string
  action: string
}

interface DashboardRoleContextValue {
  activeOrganization: ActiveOrganization | null
  activePermissions: ActivePermission[]
  isSessionRole: boolean
  organizationRole: RoleId | null
  platformRole: string
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
