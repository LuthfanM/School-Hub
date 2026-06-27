import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Home,
  MessageSquare,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type RoleId = 'platform_admin' | 'owner' | 'admin' | 'teacher' | 'student'

export type DashboardSection =
  | 'overview'
  | 'platform-tenants'
  | 'platform-settings'
  | 'students'
  | 'admins'
  | 'teachers'
  | 'classes'
  | 'attendance'
  | 'assignments'
  | 'grades'
  | 'messages'
  | 'reports'
  | 'billing'
  | 'settings'
  | 'my-courses'
  | 'my-progress'

export interface RoleConfig {
  id: RoleId
  label: string
  badge: string
  description: string
  defaultSection: DashboardSection
}

export interface ScreenConfig {
  section: DashboardSection
  label: string
  description: string
  icon: LucideIcon
  allowedRoles: RoleId[]
}

export interface DashboardPermission {
  resource: string
  action: string
}

export const roles: Record<RoleId, RoleConfig> = {
  platform_admin: {
    id: 'platform_admin',
    label: 'Global Admin',
    badge: 'Platform',
    description: 'Can provision tenants and manage SaaS-level operations only.',
    defaultSection: 'overview',
  },
  owner: {
    id: 'owner',
    label: 'Organization Owner',
    badge: 'School Owner',
    description: 'Can manage the full organization workspace and provision tenant members.',
    defaultSection: 'overview',
  },
  admin: {
    id: 'admin',
    label: 'Organization Admin',
    badge: 'School Admin',
    description: 'Can manage the organization workspace, members, students, and learning operations.',
    defaultSection: 'overview',
  },
  teacher: {
    id: 'teacher',
    label: 'Teacher',
    badge: 'Educator',
    description: 'Can manage courses, lessons, enrolled students, and learning progress.',
    defaultSection: 'overview',
  },
  student: {
    id: 'student',
    label: 'Student',
    badge: 'Learner',
    description: 'Can access assigned courses, lessons, and own progress.',
    defaultSection: 'my-courses',
  },
}

export const screens: Record<DashboardSection, ScreenConfig> = {
  overview: {
    section: 'overview',
    label: 'Summary',
    description: 'Role-specific dashboard metrics and operational summary.',
    icon: Home,
    allowedRoles: ['platform_admin', 'owner', 'admin', 'teacher'],
  },
  'platform-tenants': {
    section: 'platform-tenants',
    label: 'Tenants',
    description: 'Create and manage school organization workspaces.',
    icon: Building2,
    allowedRoles: ['platform_admin'],
  },
  'platform-settings': {
    section: 'platform-settings',
    label: 'Platform Settings',
    description: 'Global SaaS configuration and operational controls.',
    icon: ShieldCheck,
    allowedRoles: ['platform_admin'],
  },
  students: {
    section: 'students',
    label: 'Students',
    description: 'Manage academic student records and student account links.',
    icon: Users,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  admins: {
    section: 'admins',
    label: 'Admins',
    description: 'Manage organization admins and their dashboard permissions.',
    icon: UserCog,
    allowedRoles: ['owner'],
  },
  teachers: {
    section: 'teachers',
    label: 'Teachers',
    description: 'Manage teacher members and teaching assignments.',
    icon: GraduationCap,
    allowedRoles: ['owner', 'admin'],
  },
  classes: {
    section: 'classes',
    label: 'Classes',
    description: 'Manage class groups, schedules, and course groupings.',
    icon: BookOpen,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  attendance: {
    section: 'attendance',
    label: 'Attendance',
    description: 'Review attendance status and daily school activity.',
    icon: CheckCircle2,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  assignments: {
    section: 'assignments',
    label: 'Assignments',
    description: 'Manage lesson tasks and student submissions.',
    icon: ClipboardList,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  grades: {
    section: 'grades',
    label: 'Grades',
    description: 'Review academic performance and grading summaries.',
    icon: BarChart3,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  messages: {
    section: 'messages',
    label: 'Messages',
    description: 'View organization communication and parent follow-up.',
    icon: MessageSquare,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  reports: {
    section: 'reports',
    label: 'Reports',
    description: 'Review progress and operational reports.',
    icon: BarChart3,
    allowedRoles: ['owner', 'admin', 'teacher'],
  },
  billing: {
    section: 'billing',
    label: 'Billing',
    description: 'Organization billing and subscription details.',
    icon: WalletCards,
    allowedRoles: ['owner', 'admin'],
  },
  settings: {
    section: 'settings',
    label: 'Settings',
    description: 'Organization settings and workspace configuration.',
    icon: Settings,
    allowedRoles: ['owner', 'admin'],
  },
  'my-courses': {
    section: 'my-courses',
    label: 'My Courses',
    description: 'Assigned courses and published lessons.',
    icon: BookOpen,
    allowedRoles: ['student'],
  },
  'my-progress': {
    section: 'my-progress',
    label: 'My Progress',
    description: 'Personal progress across enrolled courses.',
    icon: BarChart3,
    allowedRoles: ['student'],
  },
}

export function getScreensForRole(role: RoleId, permissions: DashboardPermission[] = []) {
  return Object.values(screens).filter((screen) => canAccessScreen(role, screen.section, permissions))
}

export function canAccessScreen(role: RoleId, section: DashboardSection, permissions: DashboardPermission[] = []) {
  const baseAccess = screens[section]?.allowedRoles.includes(role) ?? false

  if (!baseAccess) return false
  if (role !== 'admin') return true
  if (section === 'overview') return true

  // Legacy/demo admins without explicit rows keep current role-based access.
  if (permissions.length === 0) return true

  const hasAllAccess = permissions.some((permission) => {
    return permission.resource === 'dashboard' && permission.action === 'access-all'
  })

  if (hasAllAccess) return true

  return permissions.some((permission) => {
    return permission.resource === `dashboard.${section}` && permission.action === 'read'
  })
}

export function normalizeSection(section: string | undefined): DashboardSection | null {
  if (!section) return null
  return section in screens ? (section as DashboardSection) : null
}
