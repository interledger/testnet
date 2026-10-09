import { z } from 'zod'

export const incomingPaymentSchema = z.object({
  body: z.object({
    walletAddress: z.string(),
    incomingAmount: z.number().positive(),
    expiresAt: z
      .object({
        value: z.coerce.number().positive().int(),
        unit: z.enum(['s', 'm', 'h', 'd'])
      })
      .optional(),
    metadata: z.string().optional()
  })
})

export const paymentDetailsSchema = z.object({
  query: z.object({
    url: z
      .string()
      .regex(
        new RegExp(
          /\/incoming-payments\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
        ),
        {
          message: 'Url is not a valid incoming payment url'
        }
      )
      .transform((val) => val.replace('$', 'https://'))
  })
})

export const sepaDetailsSchema = z.object({
  body: z.object({
    receiver: z.string(),
    legalName: z.string()
  })
})
