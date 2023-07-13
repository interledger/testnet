import { z } from 'zod'

export const paymentPointerSchema = z.object({
  body: z.object({
    paymentPointerName: z
      .string()
      .trim()
      .regex(new RegExp(/^[a-z1-9_-]*$/), {
        message:
          'Payment pointer name can only contain letters, numbers (non zero), hyphens and underscores'
      })
      .min(3, {
        message: 'Payment pointer name must be at least 3 characters long'
      })
      .refine((paymentPointerName) => paymentPointerName[0] !== '_', {
        message: 'Payment pointer name cannot start with an underscore'
      })
      .refine(
        (paymentPointerName) =>
          paymentPointerName[paymentPointerName.length - 1] !== '_',
        {
          message: 'Payment pointer name cannot end with an underscore'
        }
      )
      .refine((paymentPointerName) => paymentPointerName[0] !== '-', {
        message: 'Payment pointer name cannot start with a hyphen'
      })
      .refine(
        (paymentPointerName) =>
          paymentPointerName[paymentPointerName.length - 1] !== '-',
        {
          message: 'Payment pointer name cannot end with a hyphen'
        }
      ),
    publicName: z
      .string()
      .trim()
      .min(3, { message: 'Public name must be at least 3 characters long' })
  })
})

export const updatePaymentPointerSchema = z.object({
  body: z.object({
    publicName: z
      .string()
      .trim()
      .min(3, { message: 'Public name must be at least 3 characters long' })
  })
})
