import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
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
import { Skeleton } from '@schoolhub/ui/components/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@schoolhub/ui/components/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@schoolhub/ui/components/tabs'
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  GraduationCap,
  Grid2X2,
  List,
  Megaphone,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { apiRequest } from '../../lib/api'
import {
  classAnnouncementFormSchema,
  classFormSchema,
  classUpdateFormSchema,
  firstValidationMessage,
} from '../../lib/form-validation'
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

interface ClassSummary {
  id: string
  name: string
  code: string
  academicYear: string
  capacity: number
  status: string
  createdAt: string
  studentCount: number
  subjectCount: number
  homeroomTeacher: {
    id: string
    name: string
    email: string
  } | null
}

interface ClassDetail extends ClassSummary {
  averageScore: number | null
  announcements: Array<{
    id: string
    title: string
    body: string
    createdAt: string
    createdBy: {
      name: string
      email: string
    }
  }>
  roster: Array<{
    id: string
    status: string
    attendanceToday: string
    student: {
      id: string
      fullName: string
      nisn: string | null
      email: string | null
      status: string
    }
  }>
  subjects: Array<{
    id: string
    subjectName: string
    room: string | null
    dayOfWeek: string | null
    startTime: string | null
    endTime: string | null
    teacher: {
      id: string
      name: string
      email: string
    } | null
  }>
}

interface TeacherOption {
  id: string
  user: {
    name: string
    email: string
  }
}

interface CreateClassResponse {
  class: ClassSummary
}

interface ClassDetailResponse {
  class: ClassDetail
}

interface CreateClassAnnouncementResponse {
  announcement: ClassDetail['announcements'][number]
}

const emptyClassForm = {
  name: '',
  code: '',
  academicYear: '2026/2027',
  capacity: '30',
  homeroomTeacherId: 'none',
  status: 'active',
}

const emptyAnnouncementForm = {
  title: '',
  body: '',
}

export function ClassesScreen({ organization }: { organization: ActiveOrganization | null }) {
  const { role } = useDashboardRole()
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 1,
  })
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [isLoading, setIsLoading] = useState(Boolean(organization))
  const [error, setError] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [classDetail, setClassDetail] = useState<ClassDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(emptyClassForm)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyClassForm)
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false)
  const [announcementMode, setAnnouncementMode] = useState<'create' | 'edit'>('create')
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null)
  const [announcementError, setAnnouncementError] = useState<string | null>(null)
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm)
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([])
  const canManageClasses = role === 'owner' || role === 'admin'
  const canTakeAttendance = role === 'owner' || role === 'admin' || role === 'teacher'
  const endpoint = useMemo(() => {
    if (!organization) return null

    const params = new URLSearchParams({
      page: String(page),
      limit: '24',
    })

    if (searchQuery) params.set('search', searchQuery)

    return `/api/organizations/${organization.id}/classes?${params.toString()}`
  }, [organization, page, searchQuery])

  useEffect(() => {
    if (!endpoint) return

    let isMounted = true
    setIsLoading(true)

    apiRequest<PaginatedResponse<ClassSummary>>(endpoint)
      .then((response) => {
        if (!isMounted) return
        setClasses(response.data)
        setPagination(response.pagination)
        setError(null)
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return
        setError(requestError instanceof Error ? requestError.message : 'Failed to load classes.')
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [endpoint])

  useEffect(() => {
    if (!organization || !canManageClasses) return

    let isMounted = true

    apiRequest<PaginatedResponse<TeacherOption>>(`/api/organizations/${organization.id}/teachers?limit=100`)
      .then((response) => {
        if (isMounted) setTeacherOptions(response.data)
      })
      .catch(() => {
        if (isMounted) setTeacherOptions([])
      })

    return () => {
      isMounted = false
    }
  }, [canManageClasses, organization])

  useEffect(() => {
    if (!organization || !selectedClassId) return

    let isMounted = true
    setIsDetailLoading(true)

    apiRequest<ClassDetailResponse>(`/api/organizations/${organization.id}/classes/${selectedClassId}`)
      .then((response) => {
        if (!isMounted) return
        setClassDetail(response.class)
        setDetailError(null)
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return
        setDetailError(requestError instanceof Error ? requestError.message : 'Failed to load class detail.')
      })
      .finally(() => {
        if (isMounted) setIsDetailLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [organization, selectedClassId])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setSearchQuery(searchInput.trim())
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organization) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const parsedForm = classFormSchema.safeParse({
        ...createForm,
        homeroomTeacherId: createForm.homeroomTeacherId === 'none' ? undefined : createForm.homeroomTeacherId,
      })
      if (!parsedForm.success) {
        setCreateError(firstValidationMessage(parsedForm.error))
        return
      }

      const response = await apiRequest<CreateClassResponse>(`/api/organizations/${organization.id}/classes`, {
        method: 'POST',
        body: JSON.stringify({
          name: parsedForm.data.name,
          code: parsedForm.data.code,
          academicYear: parsedForm.data.academicYear,
          capacity: parsedForm.data.capacity,
          homeroomTeacherId: parsedForm.data.homeroomTeacherId,
        }),
      })

      setClasses((currentClasses) => [response.class, ...currentClasses])
      setPagination((currentPagination) => ({
        ...currentPagination,
        total: currentPagination.total + 1,
      }))
      setCreateForm(emptyClassForm)
      setIsCreateOpen(false)
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'Failed to create class.')
    } finally {
      setIsCreating(false)
    }
  }

  function updateCreateForm(key: keyof typeof emptyClassForm, value: string) {
    setCreateForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
    setCreateError(null)
  }

  function openEditDialog(schoolClass: ClassDetail) {
    setEditForm({
      name: schoolClass.name,
      code: schoolClass.code,
      academicYear: schoolClass.academicYear,
      capacity: String(schoolClass.capacity),
      homeroomTeacherId: schoolClass.homeroomTeacher?.id ?? 'none',
      status: schoolClass.status,
    })
    setEditError(null)
    setIsEditOpen(true)
  }

  function updateEditForm(key: keyof typeof emptyClassForm, value: string) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
    setEditError(null)
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organization || !classDetail) return

    setIsUpdating(true)
    setEditError(null)

    try {
      const parsedForm = classUpdateFormSchema.safeParse({
        ...editForm,
        homeroomTeacherId: editForm.homeroomTeacherId === 'none' ? undefined : editForm.homeroomTeacherId,
      })
      if (!parsedForm.success) {
        setEditError(firstValidationMessage(parsedForm.error))
        return
      }

      const response = await apiRequest<CreateClassResponse>(`/api/organizations/${organization.id}/classes/${classDetail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: parsedForm.data.name,
          code: parsedForm.data.code,
          academicYear: parsedForm.data.academicYear,
          capacity: parsedForm.data.capacity,
          status: parsedForm.data.status,
          homeroomTeacherId: parsedForm.data.homeroomTeacherId,
        }),
      })

      setClasses((currentClasses) => currentClasses.map((schoolClass) => {
        return schoolClass.id === response.class.id ? response.class : schoolClass
      }))
      setClassDetail((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            ...response.class,
          }
        : currentDetail)
      setIsEditOpen(false)
    } catch (requestError) {
      setEditError(requestError instanceof Error ? requestError.message : 'Failed to update class.')
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteClass() {
    if (!organization || !classDetail) return

    setIsDeleting(true)
    setDetailError(null)

    try {
      await apiRequest<{ success: boolean }>(`/api/organizations/${organization.id}/classes/${classDetail.id}`, {
        method: 'DELETE',
      })

      setClasses((currentClasses) => currentClasses.filter((schoolClass) => schoolClass.id !== classDetail.id))
      setPagination((currentPagination) => ({
        ...currentPagination,
        total: Math.max(currentPagination.total - 1, 0),
      }))
      setSelectedClassId(null)
      setClassDetail(null)
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Failed to delete class.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!organization || !classDetail) return

    setIsCreatingAnnouncement(true)
    setAnnouncementError(null)

    try {
      const parsedForm = classAnnouncementFormSchema.safeParse(announcementForm)
      if (!parsedForm.success) {
        setAnnouncementError(firstValidationMessage(parsedForm.error))
        return
      }

      const isEdit = announcementMode === 'edit' && editingAnnouncementId
      const response = await apiRequest<CreateClassAnnouncementResponse>(`/api/organizations/${organization.id}/classes/${classDetail.id}/announcements${isEdit ? `/${editingAnnouncementId}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify({
          title: parsedForm.data.title,
          body: parsedForm.data.body,
        }),
      })

      setClassDetail((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            announcements: isEdit
              ? currentDetail.announcements.map((announcement) => {
                  return announcement.id === response.announcement.id ? response.announcement : announcement
                })
              : [response.announcement, ...currentDetail.announcements],
          }
        : currentDetail)
      setAnnouncementForm(emptyAnnouncementForm)
      setAnnouncementMode('create')
      setEditingAnnouncementId(null)
      setIsAnnouncementOpen(false)
    } catch (requestError) {
      setAnnouncementError(requestError instanceof Error ? requestError.message : `Failed to ${announcementMode === 'edit' ? 'update' : 'create'} announcement.`)
    } finally {
      setIsCreatingAnnouncement(false)
    }
  }

  async function deleteAnnouncement(announcementId: string) {
    if (!organization || !classDetail) return

    setDeletingAnnouncementId(announcementId)
    setDetailError(null)

    try {
      await apiRequest<{ success: boolean }>(`/api/organizations/${organization.id}/classes/${classDetail.id}/announcements/${announcementId}`, {
        method: 'DELETE',
      })

      setClassDetail((currentDetail) => currentDetail
        ? {
            ...currentDetail,
            announcements: currentDetail.announcements.filter((announcement) => announcement.id !== announcementId),
          }
        : currentDetail)
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Failed to delete announcement.')
    } finally {
      setDeletingAnnouncementId(null)
    }
  }

  function openCreateAnnouncementDialog() {
    setAnnouncementMode('create')
    setEditingAnnouncementId(null)
    setAnnouncementForm(emptyAnnouncementForm)
    setAnnouncementError(null)
    setIsAnnouncementOpen(true)
  }

  function openEditAnnouncementDialog(announcement: ClassDetail['announcements'][number]) {
    setAnnouncementMode('edit')
    setEditingAnnouncementId(announcement.id)
    setAnnouncementForm({
      title: announcement.title,
      body: announcement.body,
    })
    setAnnouncementError(null)
    setIsAnnouncementOpen(true)
  }

  function updateAnnouncementForm(key: keyof typeof emptyAnnouncementForm, value: string) {
    setAnnouncementForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
    setAnnouncementError(null)
  }

  if (!organization) {
    return (
      <Card className={`rounded-[2rem] ${dashboardColors.card}`}>
        <CardContent className="p-8">
          <GraduationCap className={`mb-4 h-10 w-10 ${colors.warning.icon}`} />
          <h1 className="text-3xl font-bold">No active organization</h1>
          <p className={`mt-3 max-w-2xl ${colors.app.muted}`}>
            This page needs an organization membership before it can load class data.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (selectedClassId) {
    return (
      <>
        <ClassDetailView
          canCreateAnnouncement={canManageClasses || role === 'teacher'}
          deletingAnnouncementId={deletingAnnouncementId}
          canManageClasses={canManageClasses}
          canTakeAttendance={canTakeAttendance}
          classDetail={classDetail}
          detailError={detailError}
          isDetailLoading={isDetailLoading}
          isDeleting={isDeleting}
          onBack={() => {
            setSelectedClassId(null)
            setClassDetail(null)
            setDetailError(null)
          }}
          onDelete={deleteClass}
          onEdit={openEditDialog}
          onDeleteAnnouncement={deleteAnnouncement}
          onEditAnnouncement={openEditAnnouncementDialog}
          onOpenAnnouncement={openCreateAnnouncementDialog}
        />
        <ClassAnnouncementDialog
          announcementError={announcementError}
          announcementForm={announcementForm}
          announcementMode={announcementMode}
          isAnnouncementOpen={isAnnouncementOpen}
          isCreatingAnnouncement={isCreatingAnnouncement}
          onOpenChange={setIsAnnouncementOpen}
          onSubmit={submitAnnouncement}
          onUpdateForm={updateAnnouncementForm}
        />
        <ClassEditDialog
          editError={editError}
          editForm={editForm}
          isEditOpen={isEditOpen}
          isUpdating={isUpdating}
          teacherOptions={teacherOptions}
          onOpenChange={setIsEditOpen}
          onSubmit={submitEdit}
          onUpdateForm={updateEditForm}
        />
      </>
    )
  }

  const activeCount = classes.filter((schoolClass) => schoolClass.status === 'active').length
  const archivedCount = classes.filter((schoolClass) => schoolClass.status === 'archived').length
  const totalStudents = classes.reduce((sum, schoolClass) => sum + schoolClass.studentCount, 0)

  return (
    <div className="w-full space-y-6">
      <Card className={`rounded-[2rem] ${dashboardColors.card}`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div>
              <p className={`text-sm font-bold ${colors.brand.text}`}>
                {organization.name}
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Classes</h1>
              <p className={`mt-3 max-w-3xl ${colors.app.muted}`}>
                Manage class groups by academic year, homeroom teacher, capacity, roster, timetable, subjects, and class-level announcements.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="secondary">
                <Upload className="h-4 w-4" /> Bulk Import
              </Button>
              <Button type="button" variant="secondary">
                <GraduationCap className="h-4 w-4" /> Promote / Graduate
              </Button>
              {canManageClasses ? (
                <Button type="button" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> Create Class
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MetricCard label="Active classes" value={activeCount} meta={`${archivedCount} archived`} />
            <MetricCard label="Students assigned" value={totalStudents} meta="Across visible classes" />
            <MetricCard label="Academic scope" value={pagination.total} meta="Classes in this view" />
          </div>

          <form className="mt-8 flex flex-col gap-3 lg:flex-row" onSubmit={submitSearch}>
            <div className="relative flex-1">
              <Search className={`pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 ${colors.app.muted}`} />
              <Input
                className={`h-12 rounded-full pl-10 ${dashboardColors.panel}`}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search classes by name, code, or academic year"
                value={searchInput}
              />
            </div>
            <div className="flex gap-2">
              <Button className="h-12" type="submit">Search</Button>
              <Button className="h-12 w-12" type="button" variant={viewMode === 'cards' ? 'default' : 'secondary'} onClick={() => setViewMode('cards')}>
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button className="h-12 w-12" type="button" variant={viewMode === 'table' ? 'default' : 'secondary'} onClick={() => setViewMode('table')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {error ? (
            <div className={`mt-6 rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className={`mt-6 grid gap-4 rounded-2xl border p-4 ${dashboardColors.panel}`}>
              <ClassCardsSkeleton />
            </div>
          ) : null}

          {!isLoading && classes.length === 0 ? (
            <div className={`mt-6 rounded-2xl border border-dashed p-8 text-center ${colors.app.borderDashed} ${colors.app.card}`}>
              <GraduationCap className={`mx-auto mb-3 h-8 w-8 ${colors.app.muted}`} />
              <p className="font-semibold">No classes found.</p>
              <p className={`mt-2 text-sm ${colors.app.muted}`}>Create a class or adjust your search.</p>
            </div>
          ) : null}

          {!isLoading && classes.length > 0 && viewMode === 'cards' ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-3">
              {classes.map((schoolClass) => (
                <button
                  key={schoolClass.id}
                  className={`rounded-[24px] border p-5 text-left transition hover:-translate-y-1 ${dashboardColors.panel} ${colors.brand.hoverBg}`}
                  type="button"
                  onClick={() => setSelectedClassId(schoolClass.id)}
                >
                  <ClassStatusBadge status={schoolClass.status} />
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xl font-bold">{schoolClass.name}</p>
                      <p className={`mt-1 font-mono text-sm ${colors.app.muted}`}>{schoolClass.code}</p>
                    </div>
                    <Badge className={colors.brand.badge}>{schoolClass.academicYear}</Badge>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <InfoLine label="Homeroom" value={schoolClass.homeroomTeacher?.name ?? 'Unassigned'} />
                    <InfoLine label="Students" value={`${schoolClass.studentCount} / ${schoolClass.capacity} Students`} />
                    <InfoLine label="Subjects" value={`${schoolClass.subjectCount} assigned`} />
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {!isLoading && classes.length > 0 && viewMode === 'table' ? (
            <div className={`mt-6 overflow-x-auto rounded-2xl border ${colors.app.border}`}>
              <table className="w-full text-left text-sm">
                <thead className={dashboardColors.tableHeader}>
                  <tr>
                    {['Class', 'Homeroom Teacher', 'Students', 'Academic Year', 'Status'].map((head) => (
                      <th key={head} className="whitespace-nowrap px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classes.map((schoolClass) => (
                    <tr key={schoolClass.id} className={`border-t ${colors.app.border} ${colors.app.backgroundHover}`}>
                      <td className="px-4 py-4">
                        <button className="font-semibold hover:underline" type="button" onClick={() => setSelectedClassId(schoolClass.id)}>
                          {schoolClass.name}
                        </button>
                        <p className={`font-mono text-xs ${colors.app.muted}`}>{schoolClass.code}</p>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-4 ${colors.app.muted}`}>{schoolClass.homeroomTeacher?.name ?? 'Unassigned'}</td>
                      <td className="whitespace-nowrap px-4 py-4">{schoolClass.studentCount} / {schoolClass.capacity}</td>
                      <td className="whitespace-nowrap px-4 py-4">{schoolClass.academicYear}</td>
                      <td className="whitespace-nowrap px-4 py-4"><ClassStatusBadge status={schoolClass.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create class</DialogTitle>
            <DialogDescription>
              Add a class for an academic year. Roster, subjects, and timetable management can be expanded from the class detail page.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={submitCreate}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Class name">
                <Input required value={createForm.name} onChange={(event) => updateCreateForm('name', event.target.value)} placeholder="Class 10-A" />
              </Field>
              <Field label="Class code">
                <Input required value={createForm.code} onChange={(event) => updateCreateForm('code', event.target.value)} placeholder="10-A" />
              </Field>
              <Field label="Academic year">
                <Input required value={createForm.academicYear} onChange={(event) => updateCreateForm('academicYear', event.target.value)} placeholder="2026/2027" />
              </Field>
              <Field label="Capacity">
                <Input required min={1} max={200} type="number" value={createForm.capacity} onChange={(event) => updateCreateForm('capacity', event.target.value)} />
              </Field>
            </div>
            <Field label="Homeroom teacher">
              <Select value={createForm.homeroomTeacherId} onValueChange={(value) => updateCreateForm('homeroomTeacherId', value)}>
                <SelectTrigger className={`h-11 rounded-2xl ${dashboardColors.panel}`}>
                  <SelectValue placeholder="Choose a homeroom teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teacherOptions.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user.name} - {teacher.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {createError ? (
              <div className={`rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
                {createError}
              </div>
            ) : null}

            <DialogFooter>
              <Button disabled={isCreating} type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button disabled={isCreating} type="submit">
                {isCreating ? 'Creating...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ClassEditDialog
        editError={editError}
        editForm={editForm}
        isEditOpen={isEditOpen}
        isUpdating={isUpdating}
        teacherOptions={teacherOptions}
        onOpenChange={setIsEditOpen}
        onSubmit={submitEdit}
        onUpdateForm={updateEditForm}
      />
    </div>
  )
}

function ClassDetailView({
  canCreateAnnouncement,
  canManageClasses,
  canTakeAttendance,
  classDetail,
  deletingAnnouncementId,
  detailError,
  isDetailLoading,
  isDeleting,
  onBack,
  onDelete,
  onDeleteAnnouncement,
  onEdit,
  onEditAnnouncement,
  onOpenAnnouncement,
}: {
  canCreateAnnouncement: boolean
  canManageClasses: boolean
  canTakeAttendance: boolean
  classDetail: ClassDetail | null
  deletingAnnouncementId: string | null
  detailError: string | null
  isDetailLoading: boolean
  isDeleting: boolean
  onBack: () => void
  onDelete: () => void
  onDeleteAnnouncement: (announcementId: string) => void
  onEdit: (schoolClass: ClassDetail) => void
  onEditAnnouncement: (announcement: ClassDetail['announcements'][number]) => void
  onOpenAnnouncement: () => void
}) {
  return (
    <div className="w-full space-y-6">
      <Button type="button" variant="secondary" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Back to Classes
      </Button>

      {isDetailLoading ? (
        <Card className={`rounded-[2rem] ${dashboardColors.card}`}>
          <CardContent className="p-6 sm:p-8">
            <div className="space-y-5">
              <Skeleton className="schoolhub-skeleton h-8 w-40 rounded-full bg-[#dff4eb]" />
              <Skeleton className="schoolhub-skeleton h-10 w-2/3 rounded-2xl bg-[#dff4eb]" />
              <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="schoolhub-skeleton h-24 rounded-2xl bg-[#dff4eb]" />
                ))}
              </div>
              <Skeleton className="schoolhub-skeleton h-64 rounded-2xl bg-[#dff4eb]" />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {detailError ? (
        <Card className={`rounded-[2rem] ${dashboardColors.card}`}>
          <CardContent className={`p-8 ${colors.danger.text}`}>{detailError}</CardContent>
        </Card>
      ) : null}

      {classDetail ? (
        <>
          <Card className={`rounded-[2rem] ${dashboardColors.card}`}>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                <div>
                  <ClassStatusBadge status={classDetail.status} />
                  <h1 className="mt-4 text-4xl font-bold tracking-tight">{classDetail.name}</h1>
                  <p className={`mt-2 font-mono ${colors.app.muted}`}>{classDetail.code} - {classDetail.academicYear}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <MetricCard label="Homeroom" value={classDetail.homeroomTeacher?.name ?? 'Unassigned'} meta="Teacher in charge" />
                    <MetricCard label="Students" value={`${classDetail.studentCount}/${classDetail.capacity}`} meta="Roster capacity" />
                    <MetricCard label="Subjects" value={classDetail.subjectCount} meta="Teaching assignments" />
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  {canTakeAttendance ? (
                    <Button type="button">
                      <UserCheck className="h-4 w-4" /> Attendance Shortcut
                    </Button>
                  ) : null}
                  {canManageClasses ? (
                    <>
                      <Button type="button" variant="secondary" onClick={() => onEdit(classDetail)}>Edit Class</Button>
                      <Button disabled={isDeleting} type="button" variant="destructive" onClick={onDelete}>
                        {isDeleting ? 'Deleting...' : 'Delete Class'}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="roster">
            <TabsList className="h-auto flex-wrap justify-start">
              <TabsTrigger value="roster">Roster</TabsTrigger>
              <TabsTrigger value="timetable">Timetable</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>
            <TabsContent value="roster">
              <Card className={`rounded-[24px] ${dashboardColors.card}`}>
                <CardContent className="p-6">
                  <SectionTitle icon={Users} title="Roster / Daftar Siswa" />
                  <div className={`mt-5 overflow-x-auto rounded-2xl border ${colors.app.border}`}>
                    <table className="w-full text-left text-sm">
                      <thead className={dashboardColors.tableHeader}>
                        <tr>
                          {['Student', 'NIS', 'Attendance Today', 'Status', 'Actions'].map((head) => (
                            <th key={head} className="whitespace-nowrap px-4 py-3 font-semibold">{head}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {classDetail.roster.length === 0 ? (
                          <tr>
                            <td className={`px-4 py-8 text-center ${colors.app.muted}`} colSpan={5}>No students assigned to this class yet.</td>
                          </tr>
                        ) : classDetail.roster.map((row) => (
                          <tr key={row.id} className={`border-t ${colors.app.border}`}>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${colors.brand.badge}`}>
                                  {row.student.fullName.slice(0, 1)}
                                </span>
                                <span className="font-semibold">{row.student.fullName}</span>
                              </div>
                            </td>
                            <td className={`whitespace-nowrap px-4 py-4 ${colors.app.muted}`}>{row.student.nisn ?? '-'}</td>
                            <td className="whitespace-nowrap px-4 py-4"><Badge className={colors.warning.badge}>Not recorded</Badge></td>
                            <td className="whitespace-nowrap px-4 py-4"><Badge className={colors.success.badge}>{row.status}</Badge></td>
                            <td className="whitespace-nowrap px-4 py-4">
                              {canManageClasses ? <Button size="sm" type="button" variant="secondary">Move / Drop</Button> : <span className={colors.app.muted}>View only</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="timetable">
              <Card className={`rounded-[24px] ${dashboardColors.card}`}>
                <CardContent className="p-6">
                  <SectionTitle icon={CalendarDays} title="Jadwal Pelajaran" />
                  <div className="mt-5 grid gap-3 lg:grid-cols-5">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                      const subjects = classDetail.subjects.filter((subject) => subject.dayOfWeek === day)

                      return (
                        <div key={day} className={`rounded-2xl border p-4 ${dashboardColors.panel}`}>
                          <p className="font-semibold">{day}</p>
                          <div className="mt-4 space-y-3">
                            {subjects.length === 0 ? <p className={`text-sm ${colors.app.muted}`}>No schedule</p> : subjects.map((subject) => (
                              <div key={subject.id} className={`rounded-xl p-3 ${colors.app.card}`}>
                                <p className="font-semibold">{subject.subjectName}</p>
                                <p className={`text-xs ${colors.app.muted}`}>{formatTimeRange(subject)} - {subject.teacher?.name ?? 'Unassigned'}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="subjects">
              <Card className={`rounded-[24px] ${dashboardColors.card}`}>
                <CardContent className="p-6">
                  <SectionTitle icon={GraduationCap} title="Mata Pelajaran & Guru" />
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {classDetail.subjects.length === 0 ? (
                      <div className={`rounded-2xl border border-dashed p-6 text-sm ${colors.app.borderDashed} ${colors.app.muted}`}>
                        No subjects assigned yet.
                      </div>
                    ) : classDetail.subjects.map((subject) => (
                      <div key={subject.id} className={`rounded-2xl border p-4 ${dashboardColors.panel}`}>
                        <p className="font-semibold">{subject.subjectName}</p>
                        <p className={`mt-1 text-sm ${colors.app.muted}`}>{subject.teacher?.name ?? 'Teacher unassigned'}</p>
                        <p className={`mt-3 text-xs ${colors.app.muted}`}>{subject.dayOfWeek ?? 'No day'} - {formatTimeRange(subject)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="overview">
              <Card className={`rounded-[24px] ${dashboardColors.card}`}>
                <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
                  <div>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <SectionTitle icon={Megaphone} title="Pengumuman Kelas" />
                      {canCreateAnnouncement ? (
                        <Button type="button" onClick={onOpenAnnouncement}>
                          <Plus className="h-4 w-4" /> Add Announcement
                        </Button>
                      ) : null}
                    </div>
                    <div className="mt-5 space-y-3">
                      {classDetail.announcements.length === 0 ? (
                        <div className={`rounded-2xl border border-dashed p-5 text-sm ${colors.app.borderDashed} ${colors.app.muted}`}>
                          No class announcements yet.
                        </div>
                      ) : classDetail.announcements.map((announcement) => (
                        <div key={announcement.id} className={`rounded-2xl border p-5 ${dashboardColors.panel}`}>
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                            <div>
                              <p className="font-semibold">{announcement.title}</p>
                              <p className={`mt-1 text-xs ${colors.app.muted}`}>
                                {announcement.createdBy.name} - {formatDate(announcement.createdAt)}
                              </p>
                            </div>
                            {canCreateAnnouncement ? (
                              <div className="flex gap-2">
                                <Button size="sm" type="button" variant="secondary" onClick={() => onEditAnnouncement(announcement)}>
                                  Edit
                                </Button>
                                <Button
                                  disabled={deletingAnnouncementId === announcement.id}
                                  size="sm"
                                  type="button"
                                  variant="destructive"
                                  onClick={() => onDeleteAnnouncement(announcement.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {deletingAnnouncementId === announcement.id ? 'Deleting...' : 'Delete'}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                          <p className={`mt-4 text-sm leading-6 ${colors.app.muted}`}>{announcement.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionTitle icon={BarChart3} title="Performa" />
                    <div className={`mt-5 rounded-2xl border p-5 ${dashboardColors.panel}`}>
                      <p className="font-mono text-4xl font-bold">{classDetail.averageScore ?? '-'}</p>
                      <p className={`mt-2 text-sm ${colors.app.muted}`}>Average score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}

function ClassAnnouncementDialog({
  announcementError,
  announcementForm,
  announcementMode,
  isAnnouncementOpen,
  isCreatingAnnouncement,
  onOpenChange,
  onSubmit,
  onUpdateForm,
}: {
  announcementError: string | null
  announcementForm: typeof emptyAnnouncementForm
  announcementMode: 'create' | 'edit'
  isAnnouncementOpen: boolean
  isCreatingAnnouncement: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdateForm: (key: keyof typeof emptyAnnouncementForm, value: string) => void
}) {
  return (
    <Dialog open={isAnnouncementOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{announcementMode === 'edit' ? 'Edit announcement' : 'Add announcement'}</DialogTitle>
          <DialogDescription>
            {announcementMode === 'edit'
              ? 'Fix the announcement title or message.'
              : 'Publish a class-specific announcement for students, teachers, and admins who can access this class.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <Field label="Title">
            <Input required value={announcementForm.title} onChange={(event) => onUpdateForm('title', event.target.value)} placeholder="Ujian Matematika Jumat" />
          </Field>
          <Field label="Message">
            <Input required value={announcementForm.body} onChange={(event) => onUpdateForm('body', event.target.value)} placeholder="Materi: Trigonometri. Mulai jam 08:00." />
          </Field>

          {announcementError ? (
            <div className={`rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
              {announcementError}
            </div>
          ) : null}

          <DialogFooter>
            <Button disabled={isCreatingAnnouncement} type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={isCreatingAnnouncement} type="submit">
              {isCreatingAnnouncement
                ? announcementMode === 'edit' ? 'Saving...' : 'Publishing...'
                : announcementMode === 'edit' ? 'Save Announcement' : 'Publish Announcement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ClassEditDialog({
  editError,
  editForm,
  isEditOpen,
  isUpdating,
  onOpenChange,
  onSubmit,
  onUpdateForm,
  teacherOptions,
}: {
  editError: string | null
  editForm: typeof emptyClassForm
  isEditOpen: boolean
  isUpdating: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onUpdateForm: (key: keyof typeof emptyClassForm, value: string) => void
  teacherOptions: TeacherOption[]
}) {
  return (
    <Dialog open={isEditOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit class</DialogTitle>
          <DialogDescription>
            Update the class identity, academic year, capacity, status, and homeroom teacher.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class name">
              <Input required value={editForm.name} onChange={(event) => onUpdateForm('name', event.target.value)} />
            </Field>
            <Field label="Class code">
              <Input required value={editForm.code} onChange={(event) => onUpdateForm('code', event.target.value)} />
            </Field>
            <Field label="Academic year">
              <Input required value={editForm.academicYear} onChange={(event) => onUpdateForm('academicYear', event.target.value)} />
            </Field>
            <Field label="Capacity">
              <Input required min={1} max={200} type="number" value={editForm.capacity} onChange={(event) => onUpdateForm('capacity', event.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Status">
              <Select value={editForm.status} onValueChange={(value) => onUpdateForm('status', value)}>
                <SelectTrigger className={`h-11 rounded-2xl ${dashboardColors.panel}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Homeroom teacher">
              <Select value={editForm.homeroomTeacherId} onValueChange={(value) => onUpdateForm('homeroomTeacherId', value)}>
                <SelectTrigger className={`h-11 rounded-2xl ${dashboardColors.panel}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teacherOptions.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user.name} - {teacher.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {editError ? (
            <div className={`rounded-2xl border p-4 text-sm ${colors.danger.subtleBg} ${colors.app.border}`}>
              {editError}
            </div>
          ) : null}

          <DialogFooter>
            <Button disabled={isUpdating} type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={isUpdating} type="submit">
              {isUpdating ? 'Saving...' : 'Save Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MetricCard({ label, meta, value }: { label: string; meta: string; value: number | string }) {
  return (
    <div className={`rounded-2xl border p-4 ${dashboardColors.panel}`}>
      <p className={`text-sm ${colors.app.muted}`}>{label}</p>
      <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-xs ${colors.app.muted}`}>{meta}</p>
    </div>
  )
}

function ClassCardsSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="rounded-2xl border border-[#d8e5df] bg-white p-5">
          <Skeleton className="schoolhub-skeleton h-7 w-24 rounded-full bg-[#dff4eb]" />
          <Skeleton className="schoolhub-skeleton mt-5 h-7 w-2/3 rounded-2xl bg-[#dff4eb]" />
          <Skeleton className="schoolhub-skeleton mt-3 h-4 w-1/2 rounded-2xl bg-[#dff4eb]" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Skeleton className="schoolhub-skeleton h-16 rounded-2xl bg-[#dff4eb]" />
            <Skeleton className="schoolhub-skeleton h-16 rounded-2xl bg-[#dff4eb]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={colors.app.muted}>{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-5 w-5 ${colors.brand.icon}`} />
      <p className="text-lg font-bold">{title}</p>
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

function ClassStatusBadge({ status }: { status: string }) {
  if (status === 'active') {
    return <Badge className={colors.success.badge}>Active</Badge>
  }

  return <Badge className={colors.warning.badge}>Archived</Badge>
}

function formatTimeRange(subject: { startTime: string | null; endTime: string | null }) {
  if (!subject.startTime || !subject.endTime) return 'No time'
  return `${subject.startTime}-${subject.endTime}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}
