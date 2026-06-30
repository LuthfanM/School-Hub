import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@schoolhub/ui/components/dialog'
import { Input } from '@schoolhub/ui/components/input'
import { Textarea } from '@schoolhub/ui/components/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@schoolhub/ui/components/table'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  LockKeyhole,
  MailPlus,
  PlugZap,
  Search,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

import { apiRequest } from '../../lib/api'
import { colors, dashboardColors } from '../../styles/colors'

interface PlatformTenant {
  id: string
  name: string
  slug: string
  status: string
  description: string | null
  customDomain: string | null
  firstAdminEmail: string | null
  memberCount: number
  pendingInvitationCount: number
  createdAt: string
}

interface PlatformTenantListResponse {
  tenants: PlatformTenant[]
}

interface PlatformTenantCreateResponse {
  tenant: PlatformTenant
}

interface PlatformTenantResetPasswordResponse {
  reset: {
    email: string
    resetUrl: string | null
    tenantName: string
  }
}

interface CreateTenantForm {
  name: string
  slug: string
  description: string
  customDomain: string
  firstAdminEmail: string
  firstAdminPassword: string
}

const emptyCreateTenantForm: CreateTenantForm = {
  name: '',
  slug: '',
  description: '',
  customDomain: '',
  firstAdminEmail: '',
  firstAdminPassword: '',
}

const settingsGroups = [
  {
    title: 'Tenant onboarding',
    icon: Building2,
    items: [
      ['Default tenant status', 'Pending setup when first admin is invited'],
      ['First admin provisioning', 'Invite-only'],
      ['Self-registration', 'Disabled'],
    ],
  },
  {
    title: 'Auth and security',
    icon: LockKeyhole,
    items: [
      ['Email/password login', 'Enabled'],
      ['Session provider', 'Better Auth'],
      ['Support access', 'Explicit grant required'],
    ],
  },
  {
    title: 'Billing readiness',
    icon: PlugZap,
    items: [
      ['Billing provider', 'Not connected'],
      ['Plan catalog', 'Planned'],
      ['Trial duration', 'Not configured'],
    ],
  },
]

export function PlatformTenantsScreen() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetPasswordResult, setResetPasswordResult] = useState<PlatformTenantResetPasswordResponse['reset'] | null>(null)
  const [form, setForm] = useState<CreateTenantForm>(emptyCreateTenantForm)

  useEffect(() => {
    let isMounted = true

    apiRequest<PlatformTenantListResponse>('/api/platform/tenants')
      .then((response) => {
        if (!isMounted) return
        setTenants(response.tenants)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return
        setError(requestError instanceof Error ? requestError.message : 'Failed to load tenants.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const filteredTenants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) return tenants

    return tenants.filter((tenant) => {
      return [
        tenant.name,
        tenant.slug,
        tenant.status,
        tenant.firstAdminEmail ?? '',
        tenant.customDomain ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [searchQuery, tenants])

  const setupQueue = tenants.filter((tenant) => {
    return tenant.status !== 'active' || tenant.pendingInvitationCount > 0
  })

  function openCreateTenant(prefillAdminEmail = false) {
    setForm({
      ...emptyCreateTenantForm,
      firstAdminEmail: prefillAdminEmail ? '' : emptyCreateTenantForm.firstAdminEmail,
    })
    setError(null)
    setIsCreateOpen(true)
  }

  function updateForm(field: keyof CreateTenantForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: field === 'slug' ? slugify(value) : value,
      ...(field === 'name' && !currentForm.slug ? { slug: slugify(value) } : {}),
    }))
  }

  async function createTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await apiRequest<PlatformTenantCreateResponse>('/api/platform/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          customDomain: form.customDomain || undefined,
          firstAdminEmail: form.firstAdminEmail || undefined,
          firstAdminPassword: form.firstAdminPassword || undefined,
        }),
      })

      setTenants((currentTenants) => [response.tenant, ...currentTenants])
      setForm(emptyCreateTenantForm)
      setIsCreateOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create tenant.')
    } finally {
      setIsCreating(false)
    }
  }

  async function resetTenantAdminPassword(tenant: PlatformTenant) {
    if (!tenant.firstAdminEmail) return

    setIsResettingPassword(true)
    setResetPasswordResult(null)
    setError(null)

    try {
      const response = await apiRequest<PlatformTenantResetPasswordResponse>(`/api/platform/tenants/${tenant.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          email: tenant.firstAdminEmail,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }),
      })

      setResetPasswordResult(response.reset)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create reset password link.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>Platform</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Tenants</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
                Create school workspaces, invite the first organization admin, and manage tenant status without opening tenant-private academic data.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={() => openCreateTenant(false)}>
                <Building2 className="h-4 w-4" /> Create Tenant
              </Button>
              <Button type="button" variant="secondary" onClick={() => openCreateTenant(true)}>
                <MailPlus className="h-4 w-4" /> Invite Admin
              </Button>
            </div>
          </div>

          <div className="relative mt-8">
            <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
            <Input
              className={`h-12 rounded-full pl-10 ${dashboardColors.panel}`}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tenants by school, slug, domain, status, or admin email"
              value={searchQuery}
            />
          </div>

          {error ? (
            <div className={`mt-6 rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
              {error}
            </div>
          ) : null}

          <div className={`mt-6 overflow-x-auto rounded-2xl border ${colors.app.border}`}>
            <Table>
              <TableHeader className={dashboardColors.tableHeader}>
                <TableRow>
                  {['Organization', 'Slug', 'Status', 'First admin', 'Usage', 'Created', 'Action'].map((head) => (
                    <TableHead key={head} className="whitespace-nowrap font-semibold">{head}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className={`h-28 text-center ${colors.app.muted}`}>
                      Loading tenants...
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading && filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <div className="mx-auto max-w-md">
                        <Building2 className={`mx-auto mb-3 h-8 w-8 ${colors.app.muted}`} />
                        <p className="font-semibold">No tenants found.</p>
                        <p className={`mt-2 text-sm ${colors.app.muted}`}>
                          Create a tenant from this page, or run the platform tenant seed to populate sample organizations.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading
                  ? filteredTenants.map((tenant) => {
                    const canResetPassword = Boolean(tenant.firstAdminEmail && tenant.memberCount > 0)

                    return (
                    <TableRow key={tenant.id} className={`${colors.app.border} ${colors.app.backgroundHover}`}>
                      <TableCell className="min-w-56 font-semibold">{tenant.name}</TableCell>
                      <TableCell className={`whitespace-nowrap font-mono text-sm ${colors.app.muted}`}>{tenant.slug}</TableCell>
                      <TableCell><TenantStatus status={tenant.status} /></TableCell>
                      <TableCell className={colors.app.muted}>{tenant.firstAdminEmail ?? 'Not invited'}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatUsage(tenant)}</TableCell>
                      <TableCell className={`whitespace-nowrap ${colors.app.muted}`}>{formatDate(tenant.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" type="button" variant="secondary">
                            Review
                          </Button>
                          <Button
                            disabled={!canResetPassword || isResettingPassword}
                            size="sm"
                            title={canResetPassword ? `Reset password for ${tenant.firstAdminEmail}` : 'No admin account to reset yet'}
                            type="button"
                            variant="secondary"
                            onClick={() => resetTenantAdminPassword(tenant)}
                          >
                            <KeyRound className="h-4 w-4" /> Reset password
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    )
                  })
                  : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className={`rounded-[24px] ${dashboardColors.card}`}>
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <CircleAlert className={`h-5 w-5 ${colors.warning.icon}`} />
            <p className="text-lg font-bold">Operational setup queue</p>
          </div>
          {setupQueue.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-3">
              {setupQueue.map((tenant) => (
                <div key={tenant.id} className={`rounded-2xl border p-4 ${dashboardColors.panel}`}>
                  <TenantStatus status={tenant.status} />
                  <p className="mt-3 font-semibold">{tenant.name}</p>
                  <p className={`mt-1 text-sm ${colors.app.muted}`}>{getSetupTask(tenant)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${colors.app.borderDashed} ${colors.app.muted}`}>
              No tenant setup tasks right now.
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTenantDialog
        form={form}
        isCreating={isCreating}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={createTenant}
        onUpdateForm={updateForm}
      />

      <ResetPasswordLinkDialog
        reset={resetPasswordResult}
        onOpenChange={(isOpen) => {
          if (!isOpen) setResetPasswordResult(null)
        }}
      />
    </div>
  )
}

export function PlatformSettingsScreen() {
  return (
    <div className="w-full space-y-6">
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>Platform</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Platform Settings</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
                Global SaaS configuration for onboarding, authentication, operational safety, and future billing.
              </p>
            </div>
            <Badge className={colors.warning.badge}>Read-only placeholder</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {settingsGroups.map(({ title, icon: Icon, items }) => (
          <Card key={title} className={`rounded-[24px] ${dashboardColors.card}`}>
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${colors.brand.icon}`} />
                <p className="text-lg font-bold">{title}</p>
              </div>
              <div className="space-y-4">
                {items.map(([label, value]) => (
                  <div key={label} className={`flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0 ${colors.app.border}`}>
                    <span className={`text-sm ${colors.app.muted}`}>{label}</span>
                    <span className="text-right text-sm font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={`rounded-[24px] ${dashboardColors.card}`}>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${dashboardColors.panel}`}>
            <div className="mb-3 flex items-center gap-3">
              <ShieldCheck className={`h-5 w-5 ${colors.success.icon}`} />
              <p className="font-bold">Operational boundary</p>
            </div>
            <p className={`text-sm leading-6 ${colors.app.muted}`}>
              Platform settings do not grant tenant academic data access. Support access must be explicit, audited, and time-bound later.
            </p>
          </div>
          <div className={`rounded-2xl border p-5 ${dashboardColors.panel}`}>
            <div className="mb-3 flex items-center gap-3">
              <KeyRound className={`h-5 w-5 ${colors.brand.icon}`} />
              <p className="font-bold">Environment</p>
            </div>
            <div className={`space-y-2 text-sm ${colors.app.muted}`}>
              <p>API URL: configured by environment</p>
              <p>Web URL: configured by environment</p>
              <p>Database: PostgreSQL via Prisma</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CreateTenantDialog({
  form,
  isCreating,
  isOpen,
  onOpenChange,
  onSubmit,
  onUpdateForm,
}: {
  form: CreateTenantForm
  isCreating: boolean
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onUpdateForm: (field: keyof CreateTenantForm, value: string) => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create tenant</DialogTitle>
          <DialogDescription>
            Provision a school workspace. Add the first admin email when you are ready to invite them.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School name">
              <Input
                autoFocus
                onChange={(event) => onUpdateForm('name', event.target.value)}
                placeholder="Al Hikmah School"
                required
                value={form.name}
              />
            </Field>
            <Field label="Tenant slug">
              <Input
                onChange={(event) => onUpdateForm('slug', event.target.value)}
                placeholder="al-hikmah"
                required
                value={form.slug}
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              onChange={(event) => onUpdateForm('description', event.target.value)}
              placeholder="Optional internal note about this school tenant"
              value={form.description}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Custom domain">
              <Input
                onChange={(event) => onUpdateForm('customDomain', event.target.value)}
                placeholder="alhikmah.lessonhub.com"
                value={form.customDomain}
              />
            </Field>
            <Field label="First admin email">
              <Input
                onChange={(event) => onUpdateForm('firstAdminEmail', event.target.value)}
                placeholder="admin@school.sch.id"
                type="email"
                value={form.firstAdminEmail}
              />
            </Field>
          </div>

          <Field label="Development admin password">
            <Input
              minLength={8}
              onChange={(event) => onUpdateForm('firstAdminPassword', event.target.value)}
              placeholder="Fill this to create the admin login now"
              type="password"
              value={form.firstAdminPassword}
            />
            <span className={`block text-xs leading-5 ${colors.app.muted}`}>
              If email and password are filled, the system creates the admin user, accepts the invitation, creates the member row, and activates the tenant. Leave it blank for the future Resend invite flow.
            </span>
          </Field>

          <DialogFooter>
            <Button disabled={isCreating} type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={isCreating} type="submit">
              {isCreating ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordLinkDialog({
  onOpenChange,
  reset,
}: {
  onOpenChange: (isOpen: boolean) => void
  reset: PlatformTenantResetPasswordResponse['reset'] | null
}) {
  return (
    <Dialog open={Boolean(reset)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reset password link created</DialogTitle>
          <DialogDescription>
            In production this link will be sent by email. For local testing, open this development link manually.
          </DialogDescription>
        </DialogHeader>

        {reset ? (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 text-sm ${dashboardColors.panel}`}>
              <p className="font-semibold">{reset.tenantName}</p>
              <p className={`mt-1 ${colors.app.muted}`}>{reset.email}</p>
            </div>

            {reset.resetUrl ? (
              <div className="space-y-3">
                <Input readOnly value={reset.resetUrl} />
                <Button asChild>
                  <a href={reset.resetUrl} rel="noreferrer" target="_blank">
                    Open reset link
                  </a>
                </Button>
              </div>
            ) : (
              <div className={`rounded-2xl border p-4 text-sm ${colors.warning.subtleBg} ${colors.app.border}`}>
                Reset email was requested, but no development link was captured. Check the API server log.
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className={`text-sm font-semibold ${colors.app.muted}`}>{label}</span>
      {children}
    </label>
  )
}

function TenantStatus({ status }: { status: string }) {
  if (status === 'active') {
    return <Badge className={colors.success.badge}><CheckCircle2 className="h-3 w-3" /> Active</Badge>
  }

  if (status === 'suspended') {
    return <Badge className={colors.danger.badge}><AlertTriangle className="h-3 w-3" /> Suspended</Badge>
  }

  return <Badge className={colors.warning.badge}><Settings2 className="h-3 w-3" /> Pending setup</Badge>
}

function formatUsage(tenant: PlatformTenant) {
  if (tenant.pendingInvitationCount > 0 && tenant.memberCount === 0) {
    return 'Awaiting admin'
  }

  if (tenant.memberCount === 1) {
    return '1 member'
  }

  return `${tenant.memberCount} members`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getSetupTask(tenant: PlatformTenant) {
  if (tenant.status === 'suspended') return 'Review suspension status'
  if (tenant.pendingInvitationCount > 0) return 'Waiting for first admin invitation acceptance'
  if (tenant.status === 'pending_setup') return 'Invite first organization admin'

  return 'Review tenant setup'
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
