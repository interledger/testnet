import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3004),
  NODE_ENV: z.string().default('development'),
  FRONTEND_URL: z.string().default('http://localhost:4004'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:password@localhost:5433/boutique_backend'),
  PAYMENT_POINTER: z.string().default('replace-me'),
  KEY_ID: z.string().default('replace-me'),
  PRIVATE_KEY: z.string().default('replace-me')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
