import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3004),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:password@localhost:5433/commerce_backend')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
