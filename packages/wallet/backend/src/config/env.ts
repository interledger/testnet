import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
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
  GATEHUB_CARD_PP_PREFIX: z.string().default('GATEHUB_GATEHUB_CARD_PP_PREFIX'),
  GRAPHQL_ENDPOINT: z.string().url().default('http://localhost:3011/graphql'),
  AUTH_GRAPHQL_ENDPOINT: z
    .string()
    .url()
    .default('http://rafiki-auth:3008/graphql'),
  AUTH_DOMAIN: z.string().url().default('http://rafiki-auth:3009'),
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
  STRIPE_SECRET_KEY: z.string().default('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: z.string().default('STRIPE_WEBHOOK_SECRET'),
  USE_STRIPE: z.coerce.boolean().default(false)
})

export type Env = z.infer<typeof envSchema>

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('Error parsing environment variables:', result.error.flatten())
  process.exit(1)
}

export const env = result.data
