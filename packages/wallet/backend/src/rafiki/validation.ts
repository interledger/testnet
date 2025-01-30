import { z } from 'zod'
import { EventType, PaymentType } from './service'

const quoteAmountSchema = z.object({
  value: z.coerce.bigint(),
  assetCode: z.string(),
  assetScale: z.number()
})

export const quoteSchema = z.object({
  body: z.object({
    id: z.string(),
    paymentType: z.nativeEnum(PaymentType),
    walletAddressId: z.string(),
    receiver: z.string(),
    debitAmount: quoteAmountSchema,
    receiveAmount: quoteAmountSchema,
    maxPacketAmount: z.bigint().optional(),
    minExchangeRate: z.number().optional(),
    lowEstimatedExchangeRate: z.number().optional(),
    highEstimatedExchangeRate: z.number().optional(),
    createdAt: z.string(),
    expiresAt: z.string()
  })
})

const amountSchema = z.object({
  value: z.coerce.number(),
  assetCode: z.string(),
  assetScale: z.number()
})

const incomingPaymentSchema = z.object({
  id: z.string(),
  walletAddressId: z.string(),
  client: z.string().nullable().optional(),
  createdAt: z.string(),
  expiresAt: z.string(),
  updatedAt: z.string(),
  completed: z.boolean(),
  receivedAmount: amountSchema,
  incomingAmount: amountSchema.optional(),
  metadata: z
    .object({
      description: z.string().optional()
    })
    .optional()
})

const outgoingPaymentSchema = z.object({
  id: z.string(),
  walletAddressId: z.string(),
  state: z.string(),
  receiver: z.string(),
  debitAmount: amountSchema,
  receiveAmount: amountSchema,
  sentAmount: amountSchema,
  stateAttempts: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  balance: z.string(),
  client: z.string().nullable().optional(),
  metadata: z
    .object({
      description: z.string().optional()
    })
    .optional(),
  peerId: z.string().optional(),
  error: z.string().optional(),
  expiresAt: z.string().optional()
})

export const incomingPaymentWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.enum([
    EventType.IncomingPaymentCreated,
    EventType.IncomingPaymentExpired,
    EventType.IncomingPaymentCompleted
  ]),
  data: incomingPaymentSchema
})

export const outgoingPaymentWebhookSchema = z.object({
  id: z.string(),
  type: z.enum([
    EventType.OutgoingPaymentCompleted,
    EventType.OutgoingPaymentCreated,
    EventType.OutgoingPaymentFailed
  ]),
  data: outgoingPaymentSchema
})
export const walletAddressWebhookSchema = z.object({
  id: z.string(),
  type: z.literal(EventType.WalletAddressNotFound),
  data: z.object({
    walletAddressUrl: z.string()
  })
})
export const webhookSchema = z.discriminatedUnion('type', [
  incomingPaymentWebhookSchema,
  outgoingPaymentWebhookSchema,
  walletAddressWebhookSchema
])

export const webhookBodySchema = z.object({
  body: webhookSchema
})
export type WebhookType = z.infer<typeof webhookSchema>
