import { Env } from '@/config/env'
import { createKnex } from '@shared/backend'

export const generateKnex = (env: Env) => createKnex(env.DATABASE_URL)
