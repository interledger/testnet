import { z } from 'zod'
import { EventType } from './service'

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

const paymentIntentSucceededSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.payment_intent_succeeded),
  data: z.object({
    object: paymentIntentSchema
  })
})

const paymentIntentFailedSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.payment_intent_payment_failed),
  data: z.object({
    object: paymentIntentSchema.extend({
      last_payment_error: z.any()
    })
  })
})

const paymentIntentCanceledSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.payment_intent_canceled),
  data: z.object({
    object: paymentIntentSchema
  })
})

export const refundSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  payment_intent: z.string().min(1),
  charge: z.string().nullable().optional(),
  failure_reason: z.string().nullable().optional()
})

const createRefundEventSchema = (
  type:
    | typeof EventType.refund_created
    | typeof EventType.refund_updated
    | typeof EventType.refund_failed
) =>
  z.object({
    id: z.string({ required_error: 'id is required' }),
    type: z.literal(type),
    data: z.object({
      object: refundSchema
    })
  })

const refundCreatedSchema = createRefundEventSchema(EventType.refund_created)
const refundUpdatedSchema = createRefundEventSchema(EventType.refund_updated)
const refundFailedSchema = createRefundEventSchema(EventType.refund_failed)

const chargeSchema = z.object({
  id: z.string(),
  payment_intent: z.string().nullable().optional(),
  amount_refunded: z.number().optional(),
  refunded: z.boolean().optional()
})

const chargeRefundedSchema = z.object({
  id: z.string({ required_error: 'id is required' }),
  type: z.literal(EventType.charge_refunded),
  data: z.object({
    object: chargeSchema
  })
})

export const webhookSchema = z.discriminatedUnion('type', [
  paymentIntentSucceededSchema,
  paymentIntentFailedSchema,
  paymentIntentCanceledSchema,
  refundCreatedSchema,
  refundUpdatedSchema,
  refundFailedSchema,
  chargeRefundedSchema
])

export const webhookBodySchema = z.object({
  body: webhookSchema
})

export type StripeWebhookType = z.infer<typeof webhookSchema>

export type PaymentIntentSucceededWebhook = z.infer<
  typeof paymentIntentSucceededSchema
>
export type PaymentIntentFailedWebhook = z.infer<
  typeof paymentIntentFailedSchema
>
export type PaymentIntentCanceledWebhook = z.infer<
  typeof paymentIntentCanceledSchema
>
export type RefundCreatedWebhook = z.infer<typeof refundCreatedSchema>
export type RefundUpdatedWebhook = z.infer<typeof refundUpdatedSchema>
export type RefundFailedWebhook = z.infer<typeof refundFailedSchema>
export type ChargeRefundedWebhook = z.infer<typeof chargeRefundedSchema>
export type StripeRefundObject = z.infer<typeof refundSchema>
export type StripeChargeObject = z.infer<typeof chargeSchema>
