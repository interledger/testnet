import { z } from 'zod'
import { EventType } from './service'

// Define schema for the payment intent object
const paymentIntentSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  metadata: z.object({
    receiving_address: z.string({
      required_error: 'receiving_address is required in metadata'
    })
  }),
  last_payment_error: z.any().optional()
})

// Payment intent succeeded webhook schema
const paymentIntentSucceededSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.payment_intent_succeeded),
  data: z.object({
    object: paymentIntentSchema
  })
})

// Payment intent failed webhook schema
const paymentIntentFailedSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.payment_intent_payment_failed),
  data: z.object({
    object: paymentIntentSchema.extend({
      last_payment_error: z.any()
    })
  })
})

// Payment intent canceled webhook schema
const paymentIntentCanceledSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.payment_intent_canceled),
  data: z.object({
    object: paymentIntentSchema
  })
})

// Union of all possible webhook types
export const webhookSchema = z.discriminatedUnion('type', [
  paymentIntentSucceededSchema,
  paymentIntentFailedSchema,
  paymentIntentCanceledSchema
])

// Schema for the request body
export const webhookBodySchema = z.object({
  body: webhookSchema
})

export type StripeWebhookType = z.infer<typeof webhookSchema>
