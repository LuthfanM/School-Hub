import type { AuthSession } from '../auth/index.js'

export type AppEnv = {
  Variables: {
    user: AuthSession['user'] | null
    session: AuthSession['session'] | null
  }
}
