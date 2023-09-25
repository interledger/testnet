import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3004),
  NODE_ENV: z.string().default('development'),
  FRONTEND_URL: z.string().default('http://localhost:4004'),
  DATABASE_URL: z
    .string()
    .default('postgres://postgres:password@localhost:5433/boutique_backend'),
  AUTH_SERVER: z.string().url().default('http://rafiki-auth:3006'),
  PAYMENT_POINTER: z.string().default('http://rafiki-backend/shop'),
  KEY_ID: z.string().default('1d4bb0d1-b4ba-45ed-b686-c9e877e8e4fe'),
  PRIVATE_KEY: z
    .string()
    .default(
      'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1DNENBUUF3QlFZREsyVndCQ0lFSUZlYnpCaEErSU00OWxtdjlIVkd2VFBVZXJoZXNVY2hxdlpCejJOblFtc2kKLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLQ=='
    )
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
