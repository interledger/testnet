import { z } from 'zod'

const requiredString = z.string().trim().min(1)
const nonPlaceholderString = requiredString.refine(
  (value) => value !== 'replace-me',
  {
    message: 'Environment variable must be configured with a non-placeholder value'
  }
)

const envSchema = z.object({
  PORT: z.coerce.number(),
  NODE_ENV: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  PAYMENT_POINTER: nonPlaceholderString,
  KEY_ID: nonPlaceholderString,
  PRIVATE_KEY: nonPlaceholderString,
  REDIS_URL: z.string().url(),
  OPEN_PAYMENTS_USE_HTTP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
