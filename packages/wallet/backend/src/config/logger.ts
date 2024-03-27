import { Env } from '@/config/env'
import { initLogger } from '@shared/backend'

export const generateLogger = (env: Env) => initLogger(env.DATABASE_URL)
