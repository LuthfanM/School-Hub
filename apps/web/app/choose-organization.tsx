import { useMemo, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schoolhub/ui/components/card'
import { Building2 } from 'lucide-react'

import { apiRequest } from '../lib/api'
import { getOrganizationSelectionSession } from '../lib/organization-selection-session'
import { colors, dashboardColors } from '../styles/colors'

export const Route = createFileRoute('/choose-organization')({
  loader: async () => {
    const session = await getOrganizationSelectionSession()

    if (session.user.platformRole === 'platform_admin') {
      throw redirect({ to: '/dashboard' })
    }

    const activeMembershipCount = session.memberships.filter((membership) => {
      return membership.organization.status === 'active'
    }).length

    if (session.activeMembership && !session.requiresOrganizationSelection && !session.hasMultipleActiveMemberships && activeMembershipCount <= 1) {
      throw redirect({ to: '/dashboard' })
    }

    return session
  },
  component: ChooseOrganizationPage,
})

function ChooseOrganizationPage() {
  const session = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeMemberships = useMemo(() => {
    return session.memberships.filter((membership) => membership.organization.status === 'active')
  }, [session.memberships])

  async function chooseOrganization(organizationId: string) {
    setSelectedOrganizationId(organizationId)
    setIsSubmitting(true)
    setError(null)

    try {
      await apiRequest<{ preferences: { activeOrganizationId: string } }>('/api/session/preferences/active-organization', {
        method: 'PATCH',
        body: JSON.stringify({ organizationId }),
      })

      await navigate({ to: '/dashboard' })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to choose organization.')
      setIsSubmitting(false)
    }
  }

  return (
    <main className={`min-h-[100dvh] p-4 sm:p-8 ${dashboardColors.page}`}>
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl items-center">
        <Card className={`w-full rounded-[2rem] ${dashboardColors.card}`}>
          <CardHeader className="p-6 sm:p-8">
            <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${colors.brand.badge}`}>
              <Building2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl">Choose school workspace</CardTitle>
            <CardDescription className="text-base">
              This account belongs to multiple active schools. Choose which tenant you want to open.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0 sm:p-8 sm:pt-0">
            {error ? (
              <div className={`rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
                {error}
              </div>
            ) : null}

            <div className="grid gap-3">
              {activeMemberships.map((membership) => (
                <div
                  key={membership.id}
                  className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 ${dashboardColors.panel} ${colors.brand.hoverBg}`}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-lg font-bold">{membership.organization.name}</p>
                      <p className={`mt-1 font-mono text-sm ${colors.app.muted}`}>{membership.organization.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={colors.success.badge}>{membership.role}</Badge>
                      <Button
                        className="rounded-full bg-[#12343b] text-white hover:bg-[#1d4b52]"
                        disabled={isSubmitting}
                        type="button"
                        onClick={() => chooseOrganization(membership.organization.id)}
                      >
                        {isSubmitting && selectedOrganizationId === membership.organization.id ? 'Opening...' : 'Open'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
