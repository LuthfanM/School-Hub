import { createFileRoute } from '@tanstack/react-router'

import { DashboardShell } from '../components/dashboard/dashboard-shell'
import { getDashboardSession } from '../lib/dashboard-session'

export const Route = createFileRoute('/dashboard')({
  loader: () => getDashboardSession(),
  component: DashboardPage,
})

function DashboardPage() {
  const loaderSession = Route.useLoaderData()

  return (
    <DashboardShell
      initialActiveOrganization={loaderSession.activeMembership?.organization ?? null}
      initialActiveMembershipRole={loaderSession.activeMembership?.role ?? null}
      initialActivePermissions={loaderSession.activeMembership?.permissions ?? []}
      initialPlatformRole={loaderSession.user.platformRole ?? 'user'}
    />
  )
}
