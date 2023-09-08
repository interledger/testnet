import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3004),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:password@localhost:5433/commerce_backend'),
  PAYMENT_POINTER: z.string().default('http://rafiki-backend/shop'),
  KEY_ID: z.string().default('8e5e109e-9ea8-44a0-9490-1792bf1e07cb'),
  PRIVATE_KEY: z.string().default('tmp/private.pem')
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
