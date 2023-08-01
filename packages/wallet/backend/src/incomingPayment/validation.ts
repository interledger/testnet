import { z } from 'zod'

export const incomingPaymentSchema = z.object({
  body: z
    .object({
      paymentPointerId: z.string().uuid(),
      amount: z.number().positive(),
      description: z.string().optional(),
      expiration: z
        .object({
          value: z.coerce.number().positive().int(),
          unit: z.enum(['s', 'm', 'h', 'd'])
        })
        .optional()
    })
    .superRefine(({ expiration }, ctx) => {
      if (
        expiration &&
        ((expiration.value && !expiration.unit) ||
          (!expiration.value && expiration.unit))
      ) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Payment expiry was not properly specified. Please make sure that both the amount and time unit are specified',
          path: ['expiry']
        })
      }
    })
})

export const paymentDetailsSchema = z.object({
  query: z.object({
    url: z
      .string()
      .regex(
        new RegExp(
          /\/[a-z1-9_]*\/incoming-payments\/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
        ),
        {
          message: 'Url is not a valid incoming payment url'
        }
      )
      .transform((val) => val.replace('$', 'https://'))
  })
})
