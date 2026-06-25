-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'suspended', 'archived');
CREATE TYPE "MemberRole" AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE "MemberStatus" AS ENUM ('active', 'removed', 'pending');
CREATE TYPE "InvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');
CREATE TYPE "CourseStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "LessonStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "EnrollmentStatus" AS ENUM ('active', 'completed', 'removed');

-- CreateTable profiles
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT,
    "avatarUrl" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable organizations
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(50) NOT NULL UNIQUE,
    "description" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "customDomain" TEXT UNIQUE,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organizations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "profiles" ("id") ON DELETE CASCADE
);

-- CreateTable organization_members
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedBy" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
    CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "profiles" ("id") ON DELETE CASCADE,
    CONSTRAINT "organization_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "profiles" ("id") ON DELETE SET NULL
);

-- CreateTable invitations
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
    CONSTRAINT "invitations_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "profiles" ("id") ON DELETE CASCADE
);

-- CreateTable courses
CREATE TABLE "courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
    CONSTRAINT "courses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "profiles" ("id") ON DELETE CASCADE
);

-- CreateTable lessons
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "videoUrl" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lessons_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
    CONSTRAINT "lessons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE,
    CONSTRAINT "lessons_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "profiles" ("id") ON DELETE CASCADE
);

-- CreateTable course_enrollments
CREATE TABLE "course_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "course_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
    CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE,
    CONSTRAINT "course_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "profiles" ("id") ON DELETE CASCADE,
    CONSTRAINT "course_enrollments_enrolledBy_fkey" FOREIGN KEY ("enrolledBy") REFERENCES "profiles" ("id") ON DELETE SET NULL
);

-- CreateTable lesson_progress
CREATE TABLE "lesson_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lesson_progress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE,
    CONSTRAINT "lesson_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE,
    CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE,
    CONSTRAINT "lesson_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "profiles" ("id") ON DELETE CASCADE
);

-- CreateIndex organizations
CREATE INDEX "organizations_slug_idx" ON "organizations"("slug");
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex organization_members
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");
CREATE INDEX "organization_members_organizationId_idx" ON "organization_members"("organizationId");
CREATE INDEX "organization_members_userId_idx" ON "organization_members"("userId");
CREATE INDEX "organization_members_role_idx" ON "organization_members"("role");
CREATE INDEX "organization_members_status_idx" ON "organization_members"("status");

-- CreateIndex invitations
CREATE INDEX "invitations_organizationId_idx" ON "invitations"("organizationId");
CREATE INDEX "invitations_email_idx" ON "invitations"("email");
CREATE INDEX "invitations_status_idx" ON "invitations"("status");
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- CreateIndex courses
CREATE INDEX "courses_organizationId_idx" ON "courses"("organizationId");
CREATE INDEX "courses_organizationId_status_idx" ON "courses"("organizationId", "status");
CREATE INDEX "courses_createdBy_idx" ON "courses"("createdBy");

-- CreateIndex lessons
CREATE UNIQUE INDEX "lessons_courseId_orderIndex_key" ON "lessons"("courseId", "orderIndex");
CREATE INDEX "lessons_organizationId_idx" ON "lessons"("organizationId");
CREATE INDEX "lessons_courseId_idx" ON "lessons"("courseId");
CREATE INDEX "lessons_organizationId_courseId_idx" ON "lessons"("organizationId", "courseId");

-- CreateIndex course_enrollments
CREATE UNIQUE INDEX "course_enrollments_courseId_studentId_key" ON "course_enrollments"("courseId", "studentId");
CREATE INDEX "course_enrollments_organizationId_idx" ON "course_enrollments"("organizationId");
CREATE INDEX "course_enrollments_courseId_idx" ON "course_enrollments"("courseId");
CREATE INDEX "course_enrollments_studentId_idx" ON "course_enrollments"("studentId");
CREATE INDEX "course_enrollments_status_idx" ON "course_enrollments"("status");

-- CreateIndex lesson_progress
CREATE UNIQUE INDEX "lesson_progress_lessonId_studentId_key" ON "lesson_progress"("lessonId", "studentId");
CREATE INDEX "lesson_progress_organizationId_idx" ON "lesson_progress"("organizationId");
CREATE INDEX "lesson_progress_courseId_idx" ON "lesson_progress"("courseId");
CREATE INDEX "lesson_progress_lessonId_idx" ON "lesson_progress"("lessonId");
CREATE INDEX "lesson_progress_studentId_idx" ON "lesson_progress"("studentId");
