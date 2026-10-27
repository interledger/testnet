import { z } from 'zod'
import { EventType } from './service'

const amountSchema = z.object({
  value: z.string(),
  assetCode: z.string(),
  assetScale: z.number()
})

const paymentIntentSchema = z.object({
  id: z.string().uuid(),
  walletAddressId: z.string().uuid(),
  client: z.string().nullable().optional(),
  createdAt: z.string(),
  expiresAt: z.string(),
  state: z.enum(['CREATED', 'COMPLETED']).optional(),
  receivedAmount: amountSchema,
  incomingAmount: amountSchema.optional(),
  metadata: z
    .object({
      description: z.string().optional()
    })
    .optional()
})

export const paymentIntentWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.enum([EventType.PaymentIntentCreated]),
  data: paymentIntentSchema
})

export const webhookSchema = z.discriminatedUnion('type', [
  paymentIntentWebhookSchema
])

export const webhookBodySchema = z.object({
  body: webhookSchema
})

export type WebhookType = z.infer<typeof webhookSchema>
