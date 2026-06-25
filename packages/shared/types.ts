// Shared types for SchoolHub
// This file documents the key TypeScript types used throughout the app

// ============================================================================
// User & Authentication
// ============================================================================
export interface Profile {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  id: string
  email: string
}

// ============================================================================
// Organization (Tenant)
// ============================================================================
export type OrganizationStatus = 'active' | 'suspended' | 'archived'

export interface Organization {
  id: string
  name: string
  slug: string // Unique identifier for path-based routing
  description?: string
  logoUrl?: string
  status: OrganizationStatus
  customDomain?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Organization Membership & Roles
// ============================================================================
export type MemberRole = 'admin' | 'teacher' | 'student'
export type MemberStatus = 'active' | 'removed' | 'pending'

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: MemberRole
  status: MemberStatus
  invitedBy?: string
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserOrganization {
  id: string
  name: string
  slug: string
  role: MemberRole
  status: MemberStatus
}

// ============================================================================
// Invitations
// ============================================================================
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: MemberRole
  tokenHash: string // Never expose raw token in responses
  status: InvitationStatus
  expiresAt: Date
  acceptedAt?: Date
  revokedAt?: Date
  invitedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface InvitationLink {
  token: string // Raw token (only in invite link, never stored)
  expiresAt: Date
}

// ============================================================================
// Courses
// ============================================================================
export type CourseStatus = 'draft' | 'published' | 'archived'

export interface Course {
  id: string
  organizationId: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: CourseStatus
  createdBy: string
  publishedAt?: Date
  archivedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CourseWithStats extends Course {
  lessonCount: number
  enrollmentCount: number
  completedCount: number
}

// ============================================================================
// Lessons
// ============================================================================
export type LessonStatus = 'draft' | 'published' | 'archived'

export interface Lesson {
  id: string
  organizationId: string
  courseId: string
  title: string
  content?: string
  videoUrl?: string
  orderIndex: number
  status: LessonStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CourseWithLessons extends Course {
  lessons: Lesson[]
}

// ============================================================================
// Enrollment
// ============================================================================
export type EnrollmentStatus = 'active' | 'completed' | 'removed'

export interface CourseEnrollment {
  id: string
  organizationId: string
  courseId: string
  studentId: string
  enrolledBy: string
  status: EnrollmentStatus
  enrolledAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface EnrollmentWithCourse extends CourseEnrollment {
  course: Course
  student: Profile
}

// ============================================================================
// Lesson Progress
// ============================================================================
export interface LessonProgress {
  id: string
  organizationId: string
  courseId: string
  lessonId: string
  studentId: string
  completedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CourseProgress {
  total: number
  completed: number
  percentage: number
  isComplete: boolean
}

// ============================================================================
// Student Progress
// ============================================================================
export interface StudentProgress {
  courseId: string
  courseTitle: string
  percentage: number
  completed: number
  total: number
  isComplete: boolean
}

export interface StudentProgressInOrg {
  studentId: string
  studentName: string
  courses: StudentProgress[]
  overallProgress: number
}

// ============================================================================
// Permissions & Authorization
// ============================================================================
export interface PermissionCheck {
  userId: string
  organizationId: string
  requiredRole?: MemberRole
  requiredAction: string
}

export interface AuthorizationContext {
  currentUser: Profile | null
  currentOrganization: Organization | null
  currentMembership: OrganizationMember | null
  userRole: MemberRole | null
}

// ============================================================================
// API Response Types
// ============================================================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================================
// Form Submission Types
// ============================================================================
export interface CreateOrganizationInput {
  name: string
  slug: string
  description?: string
}

export interface InviteMemberInput {
  email: string
  role: MemberRole
}

export interface CreateCourseInput {
  title: string
  description?: string
  thumbnailUrl?: string
}

export interface UpdateCourseInput {
  title?: string
  description?: string
  thumbnailUrl?: string
}

export interface CreateLessonInput {
  title: string
  content?: string
  videoUrl?: string
}

export interface UpdateLessonInput {
  title?: string
  content?: string
  videoUrl?: string
  status?: LessonStatus
}

export interface EnrollStudentInput {
  studentId: string
  courseId: string
}

// ============================================================================
// UI/View Models
// ============================================================================
export interface DashboardStats {
  totalCourses: number
  totalMembers: number
  totalStudents: number
  recentCourses: Course[]
  recentProgress: StudentProgress[]
}

export interface CourseListItem {
  id: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: CourseStatus
  studentCount: number
  lessonCount: number
}

export interface CourseDetailView {
  course: Course
  lessons: Lesson[]
  studentCount: number
  progress?: CourseProgress
  isEnrolled?: boolean
}

export interface LessonViewData {
  lesson: Lesson
  course: Course
  previousLesson?: Lesson
  nextLesson?: Lesson
  isCompleted: boolean
  canMark: boolean
}

// ============================================================================
// Error Types
// ============================================================================
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  code: string
  message: string
  status: number
  details?: Record<string, any>
}

// ============================================================================
// Constants
// ============================================================================
export const RESERVED_SLUGS = [
  'www',
  'app',
  'admin',
  'api',
  'auth',
  'billing',
  'support',
  'help',
  'blog',
  'login',
  'register',
] as const

export const SLUG_REGEX = /^[a-z0-9-]+$/
export const MIN_SLUG_LENGTH = 3
export const MAX_SLUG_LENGTH = 50
