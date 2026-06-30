import type { AuthSession } from '../auth/index.js'
import type { getStudentSession } from '../services/student-auth.service.js'

export type AppEnv = {
  Variables: {
    user: AuthSession['user'] | null
    session: AuthSession['session'] | null
    studentSession: Awaited<ReturnType<typeof getStudentSession>>
  }
}
