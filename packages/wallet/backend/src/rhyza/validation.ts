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

const paymentSchema = z.object({
  id: z.string().uuid(),
  walletAddressId: z.string().uuid(),
  paymentIntentId: z.string().uuid().optional(),
  state: z.enum([
    'CREATED',
    'PROCESSING',
    'SENDING',
    'CONFIRMED',
    'REJECTED',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
  ]),
  createdAt: z.string(),
  debitAmount: amountSchema,
  sentAmount: amountSchema,
  receiveAmount: amountSchema,
  metadata: z.record(z.unknown()).optional()
})

export const paymentIntentWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.enum([
    EventType.PaymentIntentCreated,
    EventType.PaymentIntentCompleted
  ]),
  data: paymentIntentSchema
})

export const paymentWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.enum([EventType.PaymentCompleted]),
  data: paymentSchema
})

export const webhookSchema = z.discriminatedUnion('type', [
  paymentIntentWebhookSchema,
  paymentWebhookSchema
])

export const webhookBodySchema = z.object({
  body: webhookSchema
})

export type WebhookType = z.infer<typeof webhookSchema>
