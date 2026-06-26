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
  Users,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'

export type RoleId = 'platform_admin' | 'admin' | 'teacher' | 'student'

export type DashboardSection =
  | 'overview'
  | 'platform-tenants'
  | 'platform-settings'
  | 'students'
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

export const roles: Record<RoleId, RoleConfig> = {
  platform_admin: {
    id: 'platform_admin',
    label: 'Global Admin',
    badge: 'Platform',
    description: 'Can provision tenants and manage SaaS-level operations only.',
    defaultSection: 'platform-tenants',
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
    label: 'Overview',
    description: 'Organization dashboard metrics and operational summary.',
    icon: Home,
    allowedRoles: ['admin', 'teacher'],
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
    allowedRoles: ['admin', 'teacher'],
  },
  teachers: {
    section: 'teachers',
    label: 'Teachers',
    description: 'Manage teacher members and teaching assignments.',
    icon: GraduationCap,
    allowedRoles: ['admin'],
  },
  classes: {
    section: 'classes',
    label: 'Classes',
    description: 'Manage class groups, schedules, and course groupings.',
    icon: BookOpen,
    allowedRoles: ['admin', 'teacher'],
  },
  attendance: {
    section: 'attendance',
    label: 'Attendance',
    description: 'Review attendance status and daily school activity.',
    icon: CheckCircle2,
    allowedRoles: ['admin', 'teacher'],
  },
  assignments: {
    section: 'assignments',
    label: 'Assignments',
    description: 'Manage lesson tasks and student submissions.',
    icon: ClipboardList,
    allowedRoles: ['admin', 'teacher'],
  },
  grades: {
    section: 'grades',
    label: 'Grades',
    description: 'Review academic performance and grading summaries.',
    icon: BarChart3,
    allowedRoles: ['admin', 'teacher'],
  },
  messages: {
    section: 'messages',
    label: 'Messages',
    description: 'View organization communication and parent follow-up.',
    icon: MessageSquare,
    allowedRoles: ['admin', 'teacher'],
  },
  reports: {
    section: 'reports',
    label: 'Reports',
    description: 'Review progress and operational reports.',
    icon: BarChart3,
    allowedRoles: ['admin', 'teacher'],
  },
  billing: {
    section: 'billing',
    label: 'Billing',
    description: 'Organization billing and subscription details.',
    icon: WalletCards,
    allowedRoles: ['admin'],
  },
  settings: {
    section: 'settings',
    label: 'Settings',
    description: 'Organization settings and workspace configuration.',
    icon: Settings,
    allowedRoles: ['admin'],
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

export function getScreensForRole(role: RoleId) {
  return Object.values(screens).filter((screen) => screen.allowedRoles.includes(role))
}

export function canAccessScreen(role: RoleId, section: DashboardSection) {
  return screens[section]?.allowedRoles.includes(role) ?? false
}

export function normalizeSection(section: string | undefined): DashboardSection | null {
  if (!section) return null
  return section in screens ? (section as DashboardSection) : null
}
