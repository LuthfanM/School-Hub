import { supabase } from './supabase'

export interface Enrollment {
  id: string
  organizationId: string
  courseId: string
  studentId: string
  enrolledBy: string
  status: 'active' | 'completed' | 'removed'
  enrolledAt: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Get student enrollments
export async function getStudentEnrollments(
  studentId: string,
  orgId: string
) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      courses!inner (
        id,
        title,
        description,
        thumbnailUrl,
        status
      )
    `)
    .eq('studentId', studentId)
    .eq('organizationId', orgId)
    .eq('courses.status', 'published')
    .order('enrolledAt', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Get course enrollments
export async function getCourseEnrollments(
  courseId: string,
  orgId: string
) {
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      student:profiles!studentId (
        id,
        fullName,
        email
      )
    `)
    .eq('courseId', courseId)
    .eq('organizationId', orgId)
    .order('enrolledAt', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Enroll student in course
export async function enrollStudent(
  courseId: string,
  studentId: string,
  orgId: string,
  enrolledById: string
) {
  // Check if student is member of organization
  const { data: membership, error: memberError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('organizationId', orgId)
    .eq('userId', studentId)
    .single()

  if (memberError || !membership) {
    throw new Error('Student is not a member of this organization')
  }

  // Check if student is already enrolled
  const { data: existing, error: existingError } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('courseId', courseId)
    .eq('studentId', studentId)
    .single()

  if (!existingError && existing) {
    throw new Error('Student is already enrolled in this course')
  }

  // Create enrollment
  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      courseId,
      studentId,
      organizationId: orgId,
      enrolledBy: enrolledById,
      status: 'active',
      enrolledAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Unenroll student from course
export async function unenrollStudent(
  courseId: string,
  studentId: string,
  orgId: string
) {
  const { error } = await supabase
    .from('course_enrollments')
    .delete()
    .eq('courseId', courseId)
    .eq('studentId', studentId)
    .eq('organizationId', orgId)

  if (error) throw new Error(error.message)
  return true
}

// Mark lesson as complete
export async function markLessonComplete(
  lessonId: string,
  courseId: string,
  studentId: string,
  orgId: string
) {
  // Check if student is enrolled in course
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('courseId', courseId)
    .eq('studentId', studentId)
    .eq('organizationId', orgId)
    .single()

  if (enrollmentError || !enrollment) {
    throw new Error('Student is not enrolled in this course')
  }

  // Check if already completed
  const { data: existing, error: existingError } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('lessonId', lessonId)
    .eq('studentId', studentId)
    .single()

  if (!existingError && existing) {
    // Already marked complete
    return existing
  }

  // Create progress record
  const { data, error } = await supabase
    .from('lesson_progress')
    .insert({
      lessonId,
      courseId,
      studentId,
      organizationId: orgId,
      completedAt: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Get lesson completion status
export async function getLessonCompletion(
  lessonId: string,
  studentId: string
) {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('lessonId', lessonId)
    .eq('studentId', studentId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    throw new Error(error.message)
  }

  return data || null
}

// Get course completion status
export async function getCourseCompletionStatus(
  courseId: string,
  studentId: string,
  orgId: string
) {
  // Get all published lessons in course
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('courseId', courseId)
    .eq('organizationId', orgId)
    .eq('status', 'published')

  if (lessonsError) throw new Error(lessonsError.message)

  const totalLessons = lessons?.length || 0

  if (totalLessons === 0) {
    return { total: 0, completed: 0, percentage: 0, isComplete: false }
  }

  // Get completed lessons
  const { data: completed, error: completedError } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('courseId', courseId)
    .eq('studentId', studentId)
    .in('lessonId', lessons?.map((l) => l.id) || [])

  if (completedError) throw new Error(completedError.message)

  const completedCount = completed?.length || 0
  const percentage = Math.round((completedCount / totalLessons) * 100)
  const isComplete = completedCount === totalLessons

  return { total: totalLessons, completed: completedCount, percentage, isComplete }
}

// Get student progress in organization
export async function getStudentProgressInOrganization(
  studentId: string,
  orgId: string
) {
  // Get enrolled courses
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select(`
      *,
      courses!inner (
        id,
        title
      )
    `)
    .eq('studentId', studentId)
    .eq('organizationId', orgId)
    .eq('status', 'active')

  if (enrollmentError) throw new Error(enrollmentError.message)

  // Get progress for each course
  const progress = await Promise.all(
    (enrollments || []).map(async (enrollment: any) => {
      const courseProgress = await getCourseCompletionStatus(
        enrollment.courseId,
        studentId,
        orgId
      )
      return {
        courseId: enrollment.courseId,
        courseTitle: enrollment.courses.title,
        ...courseProgress,
      }
    })
  )

  return progress
}
