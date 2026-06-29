import { Fragment, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Badge } from '@schoolhub/ui/components/badge'
import { Button } from '@schoolhub/ui/components/button'
import { Card, CardContent } from '@schoolhub/ui/components/card'
import { Checkbox } from '@schoolhub/ui/components/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@schoolhub/ui/components/dialog'
import { Input } from '@schoolhub/ui/components/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@schoolhub/ui/components/table'
import { ChevronDown, ChevronRight, GraduationCap, Search, Trash2, UserCog, Users, type LucideIcon } from 'lucide-react'

import { apiRequest } from '../../lib/api'
import { useDashboardRole } from '../../lib/role-context'
import type { ActiveOrganization } from '../../lib/role-context'
import { colors, dashboardColors } from '../../styles/colors'

interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

interface StudentRow {
  id: string
  fullName: string
  nisn: string | null
  email: string | null
  phone: string | null
  status: string
  createdAt: string
}

interface TeacherRow {
  id: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
  }
}

interface CreateStudentResponse {
  student: StudentRow
}

interface CreateTeacherResponse {
  teacher: TeacherRow
}

type DirectoryKind = 'students' | 'teachers'

const adminPermissionOptions = [
  ['students', 'Students'],
  ['teachers', 'Teachers'],
  ['classes', 'Classes'],
  ['attendance', 'Attendance'],
  ['assignments', 'Assignments'],
  ['grades', 'Grades'],
  ['messages', 'Messages'],
  ['reports', 'Reports'],
  ['billing', 'Billing'],
  ['settings', 'Settings'],
] as const

type AdminPermission = typeof adminPermissionOptions[number][0]

interface AdminRow {
  id: string
  role: string
  accessMode: 'all' | 'custom'
  permissions: AdminPermission[]
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
  }
}

interface CreateAdminResponse {
  admin: AdminRow
}

interface UpdateAdminResponse {
  admin: AdminRow
}

interface AdminForm {
  name: string
  email: string
  password: string
  accessMode: 'all' | 'custom'
  permissions: AdminPermission[]
}

interface AdminPermissionDraft {
  accessMode: 'all' | 'custom'
  permissions: AdminPermission[]
}

const emptyAdminForm: AdminForm = {
  name: '',
  email: '',
  password: '',
  accessMode: 'all',
  permissions: ['students', 'teachers'],
}

export function OrganizationAdminsScreen({
  organization,
}: {
  organization: ActiveOrganization | null
}) {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  })
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(Boolean(organization))
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateBlocked, setIsCreateBlocked] = useState(false)
  const [adminPendingDeletion, setAdminPendingDeletion] = useState<AdminRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedAdminId, setExpandedAdminId] = useState<string | null>(null)
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, AdminPermissionDraft>>({})
  const [savingAdminId, setSavingAdminId] = useState<string | null>(null)
  const [form, setForm] = useState<AdminForm>(emptyAdminForm)
  const endpoint = useMemo(() => {
    if (!organization) return null

    const params = new URLSearchParams({
      page: String(page),
      limit: '25',
    })

    if (searchQuery) {
      params.set('search', searchQuery)
    }

    return `/api/organizations/${organization.id}/admins?${params.toString()}`
  }, [organization, page, searchQuery])

  useEffect(() => {
    if (!endpoint) return

    let isMounted = true
    setIsLoading(true)

    apiRequest<PaginatedResponse<AdminRow>>(endpoint)
      .then((response) => {
        if (!isMounted) return
        setAdmins(response.data)
        setPagination(response.pagination)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return
        setError(requestError instanceof Error ? requestError.message : 'Failed to load admins.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [endpoint])

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!organization || isCreateBlocked) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const response = await apiRequest<CreateAdminResponse>(`/api/organizations/${organization.id}/admins`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          accessMode: form.accessMode,
          permissions: form.accessMode === 'all' ? [] : form.permissions,
        }),
      })

      setAdmins((currentAdmins) => [response.admin, ...currentAdmins])
      setPagination((currentPagination) => ({
        ...currentPagination,
        total: currentPagination.total + 1,
      }))
      setForm(emptyAdminForm)
      closeCreateDialog()
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'Failed to create admin.')
      setIsCreateBlocked(true)
    } finally {
      setIsCreating(false)
    }
  }

  function closeCreateDialog() {
    setIsCreateOpen(false)
    setCreateError(null)
    setIsCreateBlocked(false)
  }

  function updateCreateForm(updater: (currentForm: AdminForm) => AdminForm) {
    setForm(updater)
    setCreateError(null)
    setIsCreateBlocked(false)
  }

  async function deleteAdmin() {
    if (!organization || !adminPendingDeletion) return

    setIsDeleting(true)
    setError(null)

    try {
      await apiRequest<{ success: boolean }>(`/api/organizations/${organization.id}/admins/${adminPendingDeletion.id}`, {
        method: 'DELETE',
      })

      setAdmins((currentAdmins) => currentAdmins.filter((admin) => admin.id !== adminPendingDeletion.id))
      setPagination((currentPagination) => ({
        ...currentPagination,
        total: Math.max(currentPagination.total - 1, 0),
      }))
      setAdminPendingDeletion(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete admin.')
    } finally {
      setIsDeleting(false)
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearchQuery(searchInput.trim())
  }

  function updatePermission(permission: AdminPermission, isChecked: boolean) {
    updateCreateForm((currentForm) => ({
      ...currentForm,
      permissions: isChecked
        ? [...new Set([...currentForm.permissions, permission])]
        : currentForm.permissions.filter((currentPermission) => currentPermission !== permission),
    }))
  }

  function toggleAdminPermissions(admin: AdminRow) {
    setExpandedAdminId((currentAdminId) => {
      if (currentAdminId === admin.id) return null

      setPermissionDrafts((currentDrafts) => ({
        ...currentDrafts,
        [admin.id]: currentDrafts[admin.id] ?? getAdminPermissionDraft(admin),
      }))

      return admin.id
    })
  }

  function updateAdminAccessMode(adminId: string, accessMode: 'all' | 'custom') {
    setPermissionDrafts((currentDrafts) => ({
      ...currentDrafts,
      [adminId]: {
        ...(currentDrafts[adminId] ?? { accessMode, permissions: ['students', 'teachers'] }),
        accessMode,
      },
    }))
  }

  function updateAdminPermission(adminId: string, permission: AdminPermission, isChecked: boolean) {
    setPermissionDrafts((currentDrafts) => {
      const currentDraft = currentDrafts[adminId] ?? { accessMode: 'custom', permissions: [] }

      return {
        ...currentDrafts,
        [adminId]: {
          ...currentDraft,
          permissions: isChecked
            ? [...new Set([...currentDraft.permissions, permission])]
            : currentDraft.permissions.filter((currentPermission) => currentPermission !== permission),
        },
      }
    })
  }

  async function saveAdminPermissions(admin: AdminRow) {
    if (!organization) return

    const draft = permissionDrafts[admin.id] ?? getAdminPermissionDraft(admin)

    setSavingAdminId(admin.id)
    setError(null)

    try {
      const response = await apiRequest<UpdateAdminResponse>(`/api/organizations/${organization.id}/admins/${admin.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          accessMode: draft.accessMode,
          permissions: draft.accessMode === 'all' ? [] : draft.permissions,
        }),
      })

      setAdmins((currentAdmins) => currentAdmins.map((currentAdmin) => {
        return currentAdmin.id === response.admin.id ? response.admin : currentAdmin
      }))
      setPermissionDrafts((currentDrafts) => ({
        ...currentDrafts,
        [response.admin.id]: getAdminPermissionDraft(response.admin),
      }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save admin permissions.')
    } finally {
      setSavingAdminId(null)
    }
  }

  if (!organization) {
    return <NoActiveOrganization icon={UserCog} />
  }

  return (
    <div className="w-full space-y-6">
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>
                {organization.name}
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Admins</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
                Add organization admins and limit which dashboard sections they can access.
              </p>
            </div>
            <Button type="button" onClick={() => setIsCreateOpen(true)}>Add Admin</Button>
          </div>

          <form className="relative mt-8 flex gap-3" onSubmit={submitSearch}>
            <div className="relative flex-1">
              <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
              <Input
                className={`h-12 rounded-full pl-10 ${dashboardColors.panel}`}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search admins by name or email"
                value={searchInput}
              />
            </div>
            <Button className="h-12" type="submit">Search</Button>
          </form>

          {error ? (
            <div className={`mt-6 rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
              {error}
            </div>
          ) : null}

          <div className={`mt-6 overflow-hidden rounded-2xl border ${colors.app.border}`}>
            <Table>
              <TableHeader className={dashboardColors.tableHeader}>
                <TableRow>
                  {['Admin', 'Email', 'Access', 'Permissions', 'Joined', ''].map((column) => (
                    <TableHead key={column} className="whitespace-nowrap font-semibold">{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell className={`h-28 text-center ${colors.app.muted}`} colSpan={6}>
                      Loading admins...
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading && admins.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-36 text-center" colSpan={6}>
                      <UserCog className={`mx-auto mb-3 h-8 w-8 ${colors.app.muted}`} />
                      <p className="font-semibold">No admins found for this organization.</p>
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading
                  ? admins.map((admin) => {
                    const isExpanded = expandedAdminId === admin.id
                    const draft = permissionDrafts[admin.id] ?? getAdminPermissionDraft(admin)

                    return (
                      <Fragment key={admin.id}>
                        <TableRow className={`${colors.app.border} ${colors.app.backgroundHover}`}>
                          <TableCell className="whitespace-nowrap font-semibold">
                            <div className="flex items-center gap-2">
                              <Button
                                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${admin.user.name} permissions`}
                                className="h-8 w-8"
                                onClick={() => toggleAdminPermissions(admin)}
                                size="icon"
                                title={`${isExpanded ? 'Collapse' : 'Expand'} permissions`}
                                type="button"
                                variant="ghost"
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                              <span>{admin.user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className={`whitespace-nowrap ${colors.app.muted}`}>{admin.user.email}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge className={admin.accessMode === 'all' ? colors.success.badge : colors.warning.badge}>
                              {admin.accessMode === 'all' ? 'All access' : 'Custom'}
                            </Badge>
                          </TableCell>
                          <TableCell className={colors.app.muted}>
                            {admin.accessMode === 'all' ? 'Every organization menu' : formatPermissionLabels(admin.permissions)}
                          </TableCell>
                          <TableCell className={`whitespace-nowrap ${colors.app.muted}`}>{formatDate(admin.createdAt)}</TableCell>
                          <TableCell className="w-12 text-right">
                            <Button
                              aria-label={`Delete ${admin.user.name}`}
                              className="h-9 w-9"
                              onClick={() => setAdminPendingDeletion(admin)}
                              size="icon"
                              title={`Delete ${admin.user.name}`}
                              type="button"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded ? (
                          <TableRow className={colors.app.border}>
                            <TableCell colSpan={6}>
                              <div className={`rounded-2xl border p-4 ${dashboardColors.panel}`}>
                                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                  <div>
                                    <p className="font-semibold">Dashboard permissions</p>
                                    <p className={`mt-1 text-sm ${colors.app.muted}`}>
                                      Select the dashboard sections this admin can open.
                                    </p>
                                  </div>
                                  <Button disabled={savingAdminId === admin.id} type="button" onClick={() => saveAdminPermissions(admin)}>
                                    {savingAdminId === admin.id ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>

                                <label className="mt-4 flex items-start gap-3">
                                  <Checkbox
                                    checked={draft.accessMode === 'all'}
                                    onCheckedChange={(checked) => updateAdminAccessMode(admin.id, checked ? 'all' : 'custom')}
                                  />
                                  <span>
                                    <span className="block font-semibold">Can view all organization menus</span>
                                    <span className={`block text-sm ${colors.app.muted}`}>Uncheck to manage individual permissions.</span>
                                  </span>
                                </label>

                                {draft.accessMode === 'custom' ? (
                                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {adminPermissionOptions.map(([permission, label]) => (
                                      <label key={permission} className={`flex items-center gap-3 rounded-2xl border p-3 ${colors.app.card} ${colors.app.border}`}>
                                        <Checkbox
                                          checked={draft.permissions.includes(permission)}
                                          onCheckedChange={(checked) => updateAdminPermission(admin.id, permission, Boolean(checked))}
                                        />
                                        <span className="text-sm font-semibold">{label}</span>
                                      </label>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })
                  : null}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className={`text-sm ${colors.app.muted}`}>
              Page {pagination.page} of {pagination.totalPages} - {pagination.limit} rows per page
            </p>
            <div className="flex gap-2">
              <Button disabled={isLoading || page <= 1} type="button" variant="secondary" onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}>
                Previous
              </Button>
              <Button disabled={isLoading || page >= pagination.totalPages} type="button" variant="secondary" onClick={() => setPage((currentPage) => currentPage + 1)}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={(isOpen) => {
        if (isOpen) {
          setIsCreateOpen(true)
          return
        }

        closeCreateDialog()
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add admin</DialogTitle>
            <DialogDescription>
              Create an organization admin and choose the dashboard sections they can access.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={createAdmin}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input required value={form.name} onChange={(event) => updateCreateForm((currentForm) => ({ ...currentForm, name: event.target.value }))} />
              </Field>
              <Field label="Email">
                <Input required type="email" value={form.email} onChange={(event) => updateCreateForm((currentForm) => ({ ...currentForm, email: event.target.value }))} />
              </Field>
            </div>
            <Field label="Development password">
              <Input minLength={8} type="password" value={form.password} onChange={(event) => updateCreateForm((currentForm) => ({ ...currentForm, password: event.target.value }))} />
              <span className={`block text-xs leading-5 ${colors.app.muted}`}>
                Required when this email does not already exist. Later this should become a Resend invitation flow.
              </span>
            </Field>

            <div className={`rounded-2xl border p-4 ${dashboardColors.panel}`}>
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={form.accessMode === 'all'}
                  onCheckedChange={(checked) => updateCreateForm((currentForm) => ({ ...currentForm, accessMode: checked ? 'all' : 'custom' }))}
                />
                <span>
                  <span className="block font-semibold">Can view all organization menus</span>
                  <span className={`block text-sm ${colors.app.muted}`}>Turn this off to choose specific sections below.</span>
                </span>
              </label>
            </div>

            {form.accessMode === 'custom' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {adminPermissionOptions.map(([permission, label]) => (
                  <label key={permission} className={`flex items-center gap-3 rounded-2xl border p-3 ${dashboardColors.panel}`}>
                    <Checkbox
                      checked={form.permissions.includes(permission)}
                      onCheckedChange={(checked) => updatePermission(permission, Boolean(checked))}
                    />
                    <span className="text-sm font-semibold">{label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {createError ? (
              <div className={`rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
                {createError}
              </div>
            ) : null}

            <DialogFooter>
              <Button disabled={isCreating} type="button" variant="secondary" onClick={closeCreateDialog}>
                Cancel
              </Button>
              <Button disabled={isCreating || isCreateBlocked} type="submit">
                {isCreating ? 'Creating...' : 'Create Admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(adminPendingDeletion)} onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) setAdminPendingDeletion(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete admin</DialogTitle>
            <DialogDescription>
              {adminPendingDeletion
                ? `Remove ${adminPendingDeletion.user.name} from this organization. Their admin permissions will be deleted too.`
                : 'Remove this admin from the organization.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button disabled={isDeleting} type="button" variant="secondary" onClick={() => setAdminPendingDeletion(null)}>
              Cancel
            </Button>
            <Button disabled={isDeleting} type="button" variant="destructive" onClick={deleteAdmin}>
              {isDeleting ? 'Deleting...' : 'Delete Admin'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-2">
      <span className={`text-sm font-semibold ${colors.app.muted}`}>{label}</span>
      {children}
    </label>
  )
}

function NoActiveOrganization({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <Card className={`rounded-[28px] ${dashboardColors.card}`}>
      <CardContent className="p-8">
        <Icon className={`mb-4 h-10 w-10 ${colors.warning.icon}`} />
        <h1 className="text-3xl font-bold">No active organization</h1>
        <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
          This page needs an organization membership before it can load tenant-scoped data.
        </p>
      </CardContent>
    </Card>
  )
}

export function OrganizationStudentsScreen({
  organization,
}: {
  organization: ActiveOrganization | null
}) {
  return (
    <OrganizationDirectoryScreen<StudentRow>
      columns={['Student', 'NISN', 'Email', 'Phone', 'Status', 'Created']}
      description="All student records in the active school tenant. Large datasets are loaded with server-side pagination."
      emptyText="No students found for this organization."
      getCells={(student) => [
        <span className="font-semibold">{student.fullName}</span>,
        <span className={colors.app.muted}>{student.nisn ?? '-'}</span>,
        <span className={colors.app.muted}>{student.email ?? '-'}</span>,
        <span className={colors.app.muted}>{student.phone ?? '-'}</span>,
        <StatusBadge key="status" status={student.status} />,
        <span className={colors.app.muted}>{formatDate(student.createdAt)}</span>,
      ]}
      icon={Users}
      kind="students"
      organization={organization}
      searchPlaceholder="Search students by name, NISN, email, or phone"
      title="Students"
    />
  )
}

export function OrganizationTeachersScreen({
  organization,
}: {
  organization: ActiveOrganization | null
}) {
  return (
    <OrganizationDirectoryScreen<TeacherRow>
      columns={['Teacher', 'Email', 'Role', 'Email status', 'Joined']}
      description="Teacher members in the active school tenant. This list is scoped to the current organization only."
      emptyText="No teachers found for this organization."
      getCells={(teacher) => [
        <span className="font-semibold">{teacher.user.name}</span>,
        <span className={colors.app.muted}>{teacher.user.email}</span>,
        <Badge className={colors.brand.badge}>{teacher.role}</Badge>,
        <StatusBadge key="emailStatus" status={teacher.user.emailVerified ? 'verified' : 'unverified'} />,
        <span className={colors.app.muted}>{formatDate(teacher.createdAt)}</span>,
      ]}
      icon={GraduationCap}
      kind="teachers"
      organization={organization}
      searchPlaceholder="Search teachers by name or email"
      title="Teachers"
    />
  )
}

function OrganizationDirectoryScreen<T extends { id: string }>({
  columns,
  description,
  emptyText,
  getCells,
  icon: Icon,
  kind,
  organization,
  searchPlaceholder,
  title,
}: {
  columns: string[]
  description: string
  emptyText: string
  getCells: (row: T) => ReactNode[]
  icon: LucideIcon
  kind: DirectoryKind
  organization: ActiveOrganization | null
  searchPlaceholder: string
  title: string
}) {
  const [rows, setRows] = useState<T[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  })
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(Boolean(organization))
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [isCreateBlocked, setIsCreateBlocked] = useState(false)
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    nisn: '',
    email: '',
    phone: '',
  })
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
  })
  const { role } = useDashboardRole()
  const canCreate = role === 'owner' || role === 'admin'
  const endpoint = useMemo(() => {
    if (!organization) return null

    const params = new URLSearchParams({
      page: String(page),
      limit: '25',
    })

    if (searchQuery) {
      params.set('search', searchQuery)
    }

    return `/api/organizations/${organization.id}/${kind}?${params.toString()}`
  }, [kind, organization, page, searchQuery])

  useEffect(() => {
    if (!endpoint) return

    let isMounted = true
    setIsLoading(true)

    apiRequest<PaginatedResponse<T>>(endpoint)
      .then((response) => {
        if (!isMounted) return
        setRows(response.data)
        setPagination(response.pagination)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return
        setError(requestError instanceof Error ? requestError.message : `Failed to load ${kind}.`)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [endpoint, kind])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearchQuery(searchInput.trim())
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!organization || isCreateBlocked) return

    setIsCreating(true)
    setCreateError(null)

    try {
      if (kind === 'students') {
        const response = await apiRequest<CreateStudentResponse>(`/api/organizations/${organization.id}/students`, {
          method: 'POST',
          body: JSON.stringify({
            fullName: studentForm.fullName,
            nisn: studentForm.nisn || undefined,
            email: studentForm.email || undefined,
            phone: studentForm.phone || undefined,
          }),
        })

        setRows((currentRows) => [response.student as unknown as T, ...currentRows])
      } else {
        const response = await apiRequest<CreateTeacherResponse>(`/api/organizations/${organization.id}/teachers`, {
          method: 'POST',
          body: JSON.stringify({
            name: teacherForm.name,
            email: teacherForm.email,
            password: teacherForm.password || undefined,
          }),
        })

        setRows((currentRows) => [response.teacher as unknown as T, ...currentRows])
      }

      setPagination((currentPagination) => ({
        ...currentPagination,
        total: currentPagination.total + 1,
      }))
      setStudentForm({ fullName: '', nisn: '', email: '', phone: '' })
      setTeacherForm({ name: '', email: '', password: '' })
      closeCreateDialog()
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : `Failed to create ${kind === 'students' ? 'student' : 'teacher'}.`)
      setIsCreateBlocked(true)
    } finally {
      setIsCreating(false)
    }
  }

  function closeCreateDialog() {
    setIsCreateOpen(false)
    setCreateError(null)
    setIsCreateBlocked(false)
  }

  function updateStudentForm(updater: (currentForm: typeof studentForm) => typeof studentForm) {
    setStudentForm(updater)
    setCreateError(null)
    setIsCreateBlocked(false)
  }

  function updateTeacherForm(updater: (currentForm: typeof teacherForm) => typeof teacherForm) {
    setTeacherForm(updater)
    setCreateError(null)
    setIsCreateBlocked(false)
  }

  if (!organization) {
    return (
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-8">
          <Icon className={`mb-4 h-10 w-10 ${colors.warning.icon}`} />
          <h1 className="text-3xl font-bold">No active organization</h1>
          <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
            This page needs an organization membership before it can load tenant-scoped data.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Card className={`rounded-[28px] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className={`text-sm font-bold uppercase tracking-[0.18em] ${colors.brand.text}`}>
                {organization.name}
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
              <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>{description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className={`rounded-2xl border px-4 py-3 text-sm ${dashboardColors.panel}`}>
                <span className={colors.app.muted}>Total</span>
                <span className="ml-3 font-mono text-lg font-bold">{pagination.total}</span>
              </div>
              {canCreate ? (
                <Button type="button" onClick={() => setIsCreateOpen(true)}>
                  {kind === 'students' ? 'Add Student' : 'Add Teacher'}
                </Button>
              ) : null}
            </div>
          </div>

          <form className="relative mt-8 flex gap-3" onSubmit={submitSearch}>
            <div className="relative flex-1">
              <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
              <Input
                className={`h-12 rounded-full pl-10 ${dashboardColors.panel}`}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={searchPlaceholder}
                value={searchInput}
              />
            </div>
            <Button className="h-12" type="submit">Search</Button>
          </form>

          {error ? (
            <div className={`mt-6 rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
              {error}
            </div>
          ) : null}

          <div className={`mt-6 overflow-hidden rounded-2xl border ${colors.app.border}`}>
            <Table>
              <TableHeader className={dashboardColors.tableHeader}>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap font-semibold">{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell className={`h-28 text-center ${colors.app.muted}`} colSpan={columns.length}>
                      Loading {kind}...
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-36 text-center" colSpan={columns.length}>
                      <Icon className={`mx-auto mb-3 h-8 w-8 ${colors.app.muted}`} />
                      <p className="font-semibold">{emptyText}</p>
                    </TableCell>
                  </TableRow>
                ) : null}
                {!isLoading
                  ? rows.map((row) => (
                    <TableRow key={row.id} className={`${colors.app.border} ${colors.app.backgroundHover}`}>
                      {getCells(row).map((cell, index) => (
                        <TableCell key={`${row.id}-${columns[index]}`} className="whitespace-nowrap">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                  : null}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className={`text-sm ${colors.app.muted}`}>
              Page {pagination.page} of {pagination.totalPages} - {pagination.limit} rows per page
            </p>
            <div className="flex gap-2">
              <Button
                disabled={isLoading || page <= 1}
                type="button"
                variant="secondary"
                onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
              >
                Previous
              </Button>
              <Button
                disabled={isLoading || page >= pagination.totalPages}
                type="button"
                variant="secondary"
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={(isOpen) => {
        if (isOpen) {
          setIsCreateOpen(true)
          return
        }

        closeCreateDialog()
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{kind === 'students' ? 'Add student' : 'Add teacher'}</DialogTitle>
            <DialogDescription>
              {kind === 'students'
                ? 'Create an academic student record for this organization.'
                : 'Create a teacher member for this organization. Later this should become a Resend invitation flow.'}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={submitCreate}>
            {kind === 'students' ? (
              <>
                <Field label="Full name">
                  <Input required value={studentForm.fullName} onChange={(event) => updateStudentForm((currentForm) => ({ ...currentForm, fullName: event.target.value }))} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="NISN">
                    <Input value={studentForm.nisn} onChange={(event) => updateStudentForm((currentForm) => ({ ...currentForm, nisn: event.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" value={studentForm.email} onChange={(event) => updateStudentForm((currentForm) => ({ ...currentForm, email: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Phone">
                  <Input value={studentForm.phone} onChange={(event) => updateStudentForm((currentForm) => ({ ...currentForm, phone: event.target.value }))} />
                </Field>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name">
                    <Input required value={teacherForm.name} onChange={(event) => updateTeacherForm((currentForm) => ({ ...currentForm, name: event.target.value }))} />
                  </Field>
                  <Field label="Email">
                    <Input required type="email" value={teacherForm.email} onChange={(event) => updateTeacherForm((currentForm) => ({ ...currentForm, email: event.target.value }))} />
                  </Field>
                </div>
                <Field label="Development password">
                  <Input minLength={8} type="password" value={teacherForm.password} onChange={(event) => updateTeacherForm((currentForm) => ({ ...currentForm, password: event.target.value }))} />
                  <span className={`block text-xs leading-5 ${colors.app.muted}`}>
                    Required when this email does not already exist. Existing users can be added without a password.
                  </span>
                </Field>
              </>
            )}

            {createError ? (
              <div className={`rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
                {createError}
              </div>
            ) : null}

            <DialogFooter>
              <Button disabled={isCreating} type="button" variant="secondary" onClick={closeCreateDialog}>
                Cancel
              </Button>
              <Button disabled={isCreating || isCreateBlocked} type="submit">
                {isCreating ? 'Creating...' : kind === 'students' ? 'Create Student' : 'Create Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'active' || status === 'verified') {
    return <Badge className={colors.success.badge}>{status}</Badge>
  }

  if (status === 'archived' || status === 'inactive' || status === 'unverified') {
    return <Badge className={colors.warning.badge}>{status}</Badge>
  }

  return <Badge className={colors.brand.badge}>{status}</Badge>
}

function formatPermissionLabels(permissions: string[]) {
  if (permissions.length === 0) return 'No sections selected'

  return permissions
    .map((permission) => {
      return adminPermissionOptions.find(([value]) => value === permission)?.[1] ?? permission
    })
    .join(', ')
}

function getAdminPermissionDraft(admin: AdminRow): AdminPermissionDraft {
  return {
    accessMode: admin.accessMode,
    permissions: admin.permissions.length > 0 ? admin.permissions : ['students', 'teachers'],
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
