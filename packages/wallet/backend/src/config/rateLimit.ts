import { z } from 'zod'

export const envRateLimit = () => {
  const rateLimitSchema = z
    .object({
      RATE_LIMIT: z
        .enum(['true', 'false', ''])
        .default('false')
        .transform((value) => value === 'true'),
      RATE_LIMIT_LEVEL: z.enum(['STRICT', 'NORMAL', 'LAX', '']).default('LAX'),
      SEND_EMAIL_RATE_LIMIT: z.coerce.number().default(1),
      SEND_EMAIL_RATE_LIMIT_PAUSE_IN_SECONDS: z.coerce.number().default(1800),
      SEND_EMAIL_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: z.coerce
        .number()
        .default(1800),
      LOGIN_RATE_LIMIT: z.coerce.number().default(6),
      LOGIN_RATE_LIMIT_PAUSE_IN_SECONDS: z.coerce.number().default(300),
      LOGIN_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: z.coerce
        .number()
        .default(1800),
      LOGIN_IP_RATE_LIMIT: z.coerce.number().default(30),
      LOGIN_IP_RATE_LIMIT_PAUSE_IN_SECONDS: z.coerce.number().default(1800),
      LOGIN_IP_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: z.coerce
        .number()
        .default(1800),
      LOGIN_IP_BLOCK_RATE_LIMIT: z.coerce.number().default(1500),
      LOGIN_IP_BLOCK_RATE_LIMIT_PAUSE_IN_SECONDS: z.coerce
        .number()
        .default(86400),
      LOGIN_IP_BLOCK_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: z.coerce
        .number()
        .default(86400)
    })
    .transform((data) => {
      switch (data.RATE_LIMIT_LEVEL) {
        case 'NORMAL':
          return {
            ...data,
            SEND_EMAIL_RATE_LIMIT: 1,
            SEND_EMAIL_RATE_LIMIT_PAUSE_IN_SECONDS: 3600,
            SEND_EMAIL_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 3600,
            LOGIN_RATE_LIMIT: 3,
            LOGIN_RATE_LIMIT_PAUSE_IN_SECONDS: 600,
            LOGIN_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 3600,
            LOGIN_IP_RATE_LIMIT: 30,
            LOGIN_IP_RATE_LIMIT_PAUSE_IN_SECONDS: 3600,
            LOGIN_IP_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 3600,
            LOGIN_IP_BLOCK_RATE_LIMIT: 500,
            LOGIN_IP_BLOCK_RATE_LIMIT_PAUSE_IN_SECONDS: 86400,
            LOGIN_IP_BLOCK_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 86400
          }
        case 'STRICT':
          return {
            ...data,
            SEND_EMAIL_RATE_LIMIT: 1,
            SEND_EMAIL_RATE_LIMIT_PAUSE_IN_SECONDS: 7200,
            SEND_EMAIL_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 3600,
            LOGIN_RATE_LIMIT: 3,
            LOGIN_RATE_LIMIT_PAUSE_IN_SECONDS: 1800,
            LOGIN_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 3600,
            LOGIN_IP_RATE_LIMIT: 20,
            LOGIN_IP_RATE_LIMIT_PAUSE_IN_SECONDS: 7200,
            LOGIN_IP_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 3600,
            LOGIN_IP_BLOCK_RATE_LIMIT: 250,
            LOGIN_IP_BLOCK_RATE_LIMIT_PAUSE_IN_SECONDS: 86400,
            LOGIN_IP_BLOCK_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS: 86400
          }
      }
      return data
    })

  const result = rateLimitSchema.safeParse(process.env)
  if (!result.success) {
    console.error(
      'Error parsing rate limit environment variables:',
      result.error.flatten()
    )
    process.exit(1)
  }
  return result.data
}
