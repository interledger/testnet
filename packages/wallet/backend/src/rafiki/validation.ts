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

const incomingPaymentCompletedSchema = z.object({
  id: z.string(),
  walletAddressId: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  incomingAmount: amountSchema,
  receivedAmount: amountSchema,
  completed: z.boolean(),
  updatedAt: z.string(),
  metadata: z.object({
    description: z.string()
  })
})
const incomingPaymentSchema = z.object({
  id: z.string(),
  walletAddressId: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  receivedAmount: amountSchema,
  completed: z.boolean(),
  updatedAt: z.string(),
  metadata: z.object({
    description: z.string()
  })
})
const outgoingPaymentSchema = z.object({
  id: z.string(),
  walletAddressId: z.string(),
  client: z.string(),
  state: z.string(),
  receiver: z.string(),
  debitAmount: amountSchema,
  receiveAmount: amountSchema,
  sentAmount: amountSchema,
  stateAttempts: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  balance: z.string(),
  metadata: z.object({
    description: z.string()
  })
})
const outgoingPaymentCreatedSchema = z.object({
  id: z.string(),
  walletAddressId: z.string(),
  client: z.string(),
  state: z.string(),
  receiver: z.string(),
  debitAmount: amountSchema,
  receiveAmount: amountSchema,
  sentAmount: amountSchema,
  stateAttempts: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  balance: z.string(),
  metadata: z.object({
    description: z.string()
  })
})
export const incomingPaymentCompletedWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.nativeEnum(EventType),
  data: incomingPaymentCompletedSchema
})
export const incomingPaymentWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.nativeEnum(EventType),
  data: incomingPaymentSchema
})
export const outgoingPaymentCreatedWebhookSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.nativeEnum(EventType),
  data: outgoingPaymentCreatedSchema
})
export const outgoingPaymentWebhookSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(EventType),
  data: outgoingPaymentSchema
})
export const walletAddressWebhookSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(EventType),
  data: z.object({
    walletAddressUrl: z.string()
  })
})
export const webhookSchema = z.union([
  incomingPaymentCompletedWebhookSchema,
  incomingPaymentWebhookSchema,
  outgoingPaymentWebhookSchema,
  walletAddressWebhookSchema
])
export const incomingPaymentWebhookBodySchema = z.object({
  body: incomingPaymentWebhookSchema
})
export const webhookBodySchema = z.object({
  body: webhookSchema
})
export type WebhookType = z.infer<typeof webhookSchema>

export async function validateInput<Z extends z.AnyZodObject>(
  schema: Z,
  input: WebhookType
): Promise<boolean> {
  try {
    const res = await schema.safeParseAsync(input)
    if (!res.success) {
      const errors: Record<string, string> = {}
      res.error.issues.forEach((i) => {
        if (i.path.length > 1) {
          errors[i.path[1]] = i.message
        } else {
          errors[i.path[0]] = i.message
        }
      })
      return false
    }
  } catch (error) {
    return false
  }
  return true
}
