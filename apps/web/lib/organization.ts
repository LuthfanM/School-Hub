import { supabase } from './supabase'

export type MemberRole = 'admin' | 'teacher' | 'student'

export interface UserOrganization {
  id: string
  name: string
  slug: string
  role: MemberRole
  status: string
}

// Get all organizations for current user
export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }
  
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id,
      role,
      status,
      organizations!inner (
        id,
        name,
        slug
      )
    `)
    .eq('userId', user.id)
  
  if (error) {
    throw new Error(error.message)
  }
  
  return (data || []).map((member: any) => ({
    id: member.organizations.id,
    name: member.organizations.name,
    slug: member.organizations.slug,
    role: member.role,
    status: member.status,
  }))
}

// Get organization by slug
export async function getOrganizationBySlug(slug: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

// Check if user is member of organization
export async function checkOrganizationMembership(orgId: string, userId: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organizationId', orgId)
    .eq('userId', userId)
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

// Get user role in organization
export async function getUserRoleInOrganization(orgId: string, userId: string): Promise<MemberRole | null> {
  const membership = await checkOrganizationMembership(orgId, userId)
  return membership?.role || null
}

// Check if user has permission for action
export function hasPermission(
  role: MemberRole,
  action: string
): boolean {
  const permissions: Record<MemberRole, string[]> = {
    admin: [
      'view_dashboard',
      'manage_organization_settings',
      'invite_members',
      'remove_members',
      'create_course',
      'edit_course',
      'delete_course',
      'create_lesson',
      'edit_lesson',
      'publish_course',
      'enroll_student',
      'view_all_student_progress',
      'view_own_progress',
      'access_assigned_courses',
    ],
    teacher: [
      'view_dashboard',
      'create_course',
      'edit_course',
      'delete_course',
      'create_lesson',
      'edit_lesson',
      'publish_course',
      'enroll_student',
      'view_all_student_progress',
      'view_own_progress',
      'access_assigned_courses',
    ],
    student: [
      'view_dashboard',
      'view_own_progress',
      'access_assigned_courses',
      'mark_lesson_complete',
    ],
  }
  
  return permissions[role]?.includes(action) ?? false
}

// Create organization
export async function createOrganization(
  name: string,
  slug: string,
  description?: string
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Not authenticated')
  }
  
  // Check if slug is reserved
  const reservedSlugs = [
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
  ]
  
  if (reservedSlugs.includes(slug.toLowerCase())) {
    throw new Error('This slug is reserved')
  }
  
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug: slug.toLowerCase(),
      description,
      createdBy: user.id,
    })
    .select()
    .single()
  
  if (orgError) {
    throw new Error(orgError.message)
  }
  
  // Add user as admin
  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organizationId: org.id,
      userId: user.id,
      role: 'admin',
      status: 'active',
    })
  
  if (memberError) {
    throw new Error(memberError.message)
  }
  
  return org
}
