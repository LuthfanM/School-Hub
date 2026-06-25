import { supabase } from './supabase'

export interface Course {
  id: string
  organizationId: string
  title: string
  description?: string
  thumbnailUrl?: string
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  publishedAt?: string
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  organizationId: string
  courseId: string
  title: string
  content?: string
  videoUrl?: string
  orderIndex: number
  status: 'draft' | 'published' | 'archived'
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CourseWithLessons extends Course {
  lessons: Lesson[]
}

// Get courses for organization
export async function getCoursesByOrganization(
  orgId: string,
  status?: 'draft' | 'published' | 'archived'
) {
  let query = supabase
    .from('courses')
    .select('*')
    .eq('organizationId', orgId)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query.order('createdAt', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

// Get single course with lessons
export async function getCourseWithLessons(
  courseId: string,
  orgId: string
): Promise<CourseWithLessons | null> {
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('organizationId', orgId)
    .single()

  if (courseError) return null

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .eq('courseId', courseId)
    .order('orderIndex', { ascending: true })

  if (lessonsError) throw new Error(lessonsError.message)

  return {
    ...course,
    lessons: lessons || [],
  }
}

// Get course progress for student
export async function getCourseProgress(
  courseId: string,
  studentId: string,
  orgId: string
) {
  // Get all published lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id')
    .eq('courseId', courseId)
    .eq('organizationId', orgId)
    .eq('status', 'published')

  if (lessonsError) throw new Error(lessonsError.message)
  const totalLessons = lessons?.length || 0

  // Get completed lessons
  const { data: completed, error: completedError } = await supabase
    .from('lesson_progress')
    .select('id')
    .eq('courseId', courseId)
    .eq('studentId', studentId)
    .in(
      'lessonId',
      lessons?.map((l) => l.id) || []
    )

  if (completedError) throw new Error(completedError.message)
  const completedCount = completed?.length || 0

  return {
    total: totalLessons,
    completed: completedCount,
    percentage: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
  }
}

// Create course
export async function createCourse(
  orgId: string,
  userId: string,
  title: string,
  description?: string,
  thumbnailUrl?: string
) {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      organizationId: orgId,
      title,
      description,
      thumbnailUrl,
      createdBy: userId,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Update course
export async function updateCourse(
  courseId: string,
  orgId: string,
  updates: Partial<Course>
) {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .eq('organizationId', orgId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Publish course
export async function publishCourse(courseId: string, orgId: string) {
  const { data, error } = await supabase
    .from('courses')
    .update({
      status: 'published',
      publishedAt: new Date().toISOString(),
    })
    .eq('id', courseId)
    .eq('organizationId', orgId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Archive course
export async function archiveCourse(courseId: string, orgId: string) {
  const { data, error } = await supabase
    .from('courses')
    .update({
      status: 'archived',
      archivedAt: new Date().toISOString(),
    })
    .eq('id', courseId)
    .eq('organizationId', orgId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Create lesson
export async function createLesson(
  courseId: string,
  orgId: string,
  userId: string,
  title: string,
  content?: string,
  videoUrl?: string
) {
  // Get max order index
  const { data: lessons, error: fetchError } = await supabase
    .from('lessons')
    .select('orderIndex')
    .eq('courseId', courseId)
    .order('orderIndex', { ascending: false })
    .limit(1)

  if (fetchError) throw new Error(fetchError.message)

  const maxOrder = lessons?.[0]?.orderIndex ?? 0
  const newOrder = maxOrder + 1

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      courseId,
      organizationId: orgId,
      title,
      content,
      videoUrl,
      orderIndex: newOrder,
      createdBy: userId,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Update lesson
export async function updateLesson(
  lessonId: string,
  orgId: string,
  updates: Partial<Lesson>
) {
  const { data, error } = await supabase
    .from('lessons')
    .update(updates)
    .eq('id', lessonId)
    .eq('organizationId', orgId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// Reorder lessons
export async function reorderLessons(
  courseId: string,
  orgId: string,
  lessonIds: string[]
) {
  // Update each lesson with new order
  const updates = lessonIds.map((id, index) => ({
    id,
    orderIndex: index,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('lessons')
      .update({ orderIndex: update.orderIndex })
      .eq('id', update.id)
      .eq('courseId', courseId)
      .eq('organizationId', orgId)

    if (error) throw new Error(error.message)
  }

  return true
}
