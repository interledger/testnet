import { z } from 'zod'
import { validateTlsFile } from '@/hsm/atalla/tls-files'

const booleanString = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true')

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(3000),
    METRICS_PORT: z.coerce.number().default(9464),
    NODE_ENV: z.string().default('development'),
    DATABASE_URL: z
      .string()
      .default('postgres://postgres:password@localhost:5433/wallet_backend'),
    REDIS_URL: z.string().default('redis://redis:6379/0'),
    COOKIE_NAME: z.string().default('testnet.cookie'),
    COOKIE_PASSWORD: z
      .string()
      .default('testnet.cookie.password.super.secret.ilp'), // min. 32 chars
    COOKIE_TTL: z.coerce.number().default(2630000), // 1 month
    GATEHUB_ENV: z.enum(['production', 'sandbox']).default('sandbox'),
    // Required GateHub API base URL (fail fast if missing).
    // Real GateHub examples:
    // - Sandbox: https://api.sandbox.gatehub.net
    // - Production: https://api.gatehub.net
    GATEHUB_API_BASE_URL: z.string().url(),
    // Required iframe URLs (fail fast if missing).
    // Real GateHub examples:
    // - Sandbox: https://managed-ramp.sandbox.gatehub.net
    //            https://exchange.sandbox.gatehub.net
    //            https://onboarding.sandbox.gatehub.net
    // - Production: https://managed-ramp.gatehub.net
    //               https://exchange.gatehub.net
    //               https://onboarding.gatehub.net
    GATEHUB_IFRAME_MANAGED_RAMP_URL: z.string().url(),
    GATEHUB_IFRAME_EXCHANGE_URL: z.string().url(),
    GATEHUB_IFRAME_ONBOARDING_URL: z.string().url(),
    GATEHUB_ACCESS_KEY: z.string().default('GATEHUB_ACCESS_KEY'),
    GATEHUB_SECRET_KEY: z.string().default('GATEHUB_SECRET_KEY'),
    GATEHUB_SEPA_ACCESS_KEY: z.string().optional(),
    GATEHUB_SEPA_SECRET_KEY: z.string().optional(),
    GATEHUB_SEPA_ORG_ID: z.string().optional(),
    GATEHUB_WEBHOOK_SECRET: z.string().default('GATEHUB_WEBHOOK_SECRET'),
    GATEHUB_GATEWAY_UUID: z.string().default('GATEHUB_GATEWAY_UUID'),
    GATEHUB_SETTLEMENT_WALLET_ADDRESS: z
      .string()
      .default('GATEHUB_SETTLEMENT_WALLET_ADDRESS'),
    GATEHUB_ORG_ID: z.string().default('GATEHUB_ORG_ID'),
    GATEHUB_CARD_APP_ID: z.string().default('GATEHUB_CARD_APP_ID'),
    GATEHUB_ACCOUNT_PRODUCT_CODE: z
      .string()
      .default('GATEHUB_ACCOUNT_PRODUCT_CODE'),
    GATEHUB_CARD_PRODUCT_CODE: z.string().default('GATEHUB_CARD_PRODUCT_CODE'),
    GATEHUB_NAME_ON_CARD: z
      .string()
      .regex(/^[a-zA-Z0-9]*$/, 'Only alphanumeric characters are allowed')
      .default('INTERLEDGER'),
    GATEHUB_CARD_PP_PREFIX: z
      .string()
      .default('GATEHUB_GATEHUB_CARD_PP_PREFIX'),
    GRAPHQL_ENDPOINT: z.string().url().default('http://localhost:3011/graphql'),
    AUTH_GRAPHQL_ENDPOINT: z
      .string()
      .url()
      .default('http://rafiki-auth:3008/graphql'),
    AUTH_DOMAIN: z.string().url().default('https://auth.testnet.test'),
    AUTH_IDENTITY_SERVER_SECRET: z.string().default('replace-me'),
    RAFIKI_WEBHOOK_SIGNATURE_SECRET: z.string().default('replace-me'),
    ADMIN_SIGNATURE_VERSION: z.string().default('1'),
    ADMIN_API_SECRET: z.string().default('replace-me'),
    OPERATOR_TENANT_ID: z.string().default('tenant'),
    OPEN_PAYMENTS_HOST: z.string().url().default('https://backend:80'),
    RAFIKI_MONEY_FRONTEND_HOST: z.string().default('localhost'),
    SENDGRID_API_KEY: z.string().default('SG.API_KEY'),
    FROM_EMAIL: z.string().default('tech@interledger.org'),
    SEND_EMAIL: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    CARD_DATA_HREF: z.string().default('UPDATEME'),
    CARD_PIN_HREF: z.string().default('UPDATEME'),
    HSM_ENABLED: booleanString('false'),
    HSM_SERVER_ROLE: z.enum(['both', 'issuer', 'merchant']).default('both'),
    HSM_GRPC_HOST: z.string().trim().min(1).default('0.0.0.0'),
    ISSUER_GRPC_HOST: z.string().trim().min(1).optional(),
    ISSUER_GRPC_PORT: z.coerce.number().int().min(1).max(65_535).default(50051),
    MERCHANT_GRPC_HOST: z.string().trim().min(1).optional(),
    MERCHANT_GRPC_PORT: z.coerce
      .number()
      .int()
      .min(1)
      .max(65_535)
      .default(50052),
    ATALLA_HOST: z.string().trim().min(1).optional(),
    ATALLA_PORT: z.coerce.number().int().min(1).max(65_535).optional(),
    ATALLA_TIMEOUT_MS: z.coerce.number().positive().default(2_000),
    ATALLA_POOL_SIZE: z.coerce.number().int().positive().default(1),
    ATALLA_TLS_ENABLED: booleanString('true'),
    ATALLA_SKIP_SERVER_IDENTITY_CHECK: booleanString('true'),
    ATALLA_CA_CERT_PATH: z.string().trim().min(1).optional(),
    ATALLA_CLIENT_CERT_PATH: z.string().trim().min(1).optional(),
    ATALLA_CLIENT_KEY_PATH: z.string().trim().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().default('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: z.string().default('STRIPE_WEBHOOK_SECRET'),
    USE_STRIPE: z.coerce.boolean().default(false)
  })
  .superRefine((env, ctx) => {
    if (!env.HSM_ENABLED) return

    for (const key of ['ATALLA_HOST', 'ATALLA_PORT'] as const) {
      if (env[key]) continue

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required when HSM_ENABLED=true`
      })
    }

    if (!env.ATALLA_TLS_ENABLED) return

    // The process must stop at start-up if a certificate is missing or
    // unreadable. This loop checks each path on disk. It records a reason for
    // every bad path, so one start-up reports all of them.
    for (const key of [
      'ATALLA_CA_CERT_PATH',
      'ATALLA_CLIENT_CERT_PATH',
      'ATALLA_CLIENT_KEY_PATH'
    ] as const) {
      const filePath = env[key]

      if (!filePath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required when HSM_ENABLED=true and ATALLA_TLS_ENABLED=true`
        })
        continue
      }

      const problem = validateTlsFile(filePath)

      if (problem) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: problem
        })
      }
    }
  })

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
