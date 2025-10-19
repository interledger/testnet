import { z } from 'zod'

export const incomingPaymentSchema = z.object({
  body: z.object({
    walletAddressId: z.string().uuid(),
    amount: z.number().positive(),
    description: z.string().optional(),
    expiration: z
      .object({
        value: z.coerce.number().positive().int(),
        unit: z.enum(['s', 'm', 'h', 'd'])
      })
      .optional()
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
  query: z.object({
    receiver: z.string(),
    legalName: z.string()
  })
})
