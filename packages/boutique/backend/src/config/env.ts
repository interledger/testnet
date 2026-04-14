import { z } from 'zod'

const requiredString = z.string().trim().min(1)
const httpsUrlString = z.string().trim().url().refine(
  (value) => value.startsWith('https://'),
  {
    message: 'PAYMENT_POINTER must be a URL starting with https:// instead of tje classic "$" format'
  }
)
const base64String = requiredString.refine(
  (value) => {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
      return false
    }

    try {
      return Buffer.from(value, 'base64').toString('base64') === value
    } catch {
      return false
    }
  },
  {
    message: 'PRIVATE_KEY must be a valid base64-encoded string'
  }
)

const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  PAYMENT_POINTER: httpsUrlString,
  KEY_ID: requiredString,
  PRIVATE_KEY: base64String,
  REDIS_URL: z.string().url(),
  USE_HTTP_FOR_OPEN_PAYMENTS: z.boolean().optional()
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
