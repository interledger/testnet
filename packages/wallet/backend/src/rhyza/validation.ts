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
  paymentIntentId: z.string().uuid(),
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
  type: z.enum([
    EventType.PaymentCompleted,
    EventType.PaymentFailed,
    EventType.PaymentCreated
  ]),
  data: paymentSchema
})

const limitsBaseSchema = z.object({
  receiver: z.string(),
  assetCode: z.string(),
  assetScale: z.number().int(),
  interval: z.string().optional()
})

const limitsSchema = z.union([
  limitsBaseSchema.extend({
    receiveAmount: z.string(),
    debitAmount: z.string().optional()
  }),
  limitsBaseSchema.extend({
    debitAmount: z.string(),
    receiveAmount: z.string().optional()
  })
])

export const grantRevokedWebhookSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('grant.revoked'),
  data: z.object({
    createdAt: z.string(),
    id: z.string().uuid(),
    status: z.enum([
      'PROCESSING',
      'PENDING',
      'APPROVED',
      'ISSUED',
      'REVOKED',
      'REJECTED'
    ]),
    access: z
      .array(
        z.object({
          actions: z.array(
            z.enum([
              'CREATE',
              'COMPLETE',
              'READ',
              'READ_ALL',
              'LIST',
              'LIST_ALL'
            ])
          ),
          type: z.enum(['INCOMING_PAYMENT', 'OUTGOING_PAYMENT', 'QUOTE']),
          identifier: z.string().optional(),
          limits: limitsSchema.optional()
        })
      )
      .optional(),
    client: z
      .union([
        z.string(),
        z.object({
          alg: z.string(),
          crv: z.string(),
          kid: z.string(),
          kty: z.string(),
          x: z.string(),
          use: z.string().optional()
        })
      ])
      .optional(),
    clientName: z.string().optional(),
    interaction: z
      .object({
        createdAt: z.string(),
        state: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
      })
      .optional(),
    subjectIds: z
      .array(
        z.object({
          format: z.string(),
          id: z.string()
        })
      )
      .optional()
  })
})

export const webhookSchema = z.discriminatedUnion('type', [
  paymentIntentWebhookSchema,
  paymentWebhookSchema,
  grantRevokedWebhookSchema
])

export const webhookBodySchema = z.object({
  body: webhookSchema
})

export type WebhookType = z.infer<typeof webhookSchema>
