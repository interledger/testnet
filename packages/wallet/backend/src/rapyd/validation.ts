import { z, AnyZodObject, ZodEffects } from 'zod'

export const kycSchema = z.object({
  body: z.object({
    documentType: z.string({ required_error: 'document type is required' }),
    frontSideImage: z.string({
      required_error: 'front side image is required'
    }),
    frontSideImageType: z.string({
      required_error: 'front side image mime type is required'
    }),
    faceImage: z.string({ required_error: 'face image is required' }),
    faceImageType: z.string({
      required_error: 'face image mime type is required'
    }),
    backSideImage: z.string().optional(),
    backSideImageType: z.string().optional()
  })
})

export const profileSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }),
    lastName: z.string({ required_error: 'Last name is required' })
  })
})

export const walletSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }),
    lastName: z.string({ required_error: 'Last name is required' }),
    address: z.string({ required_error: 'Address is required' }),
    city: z.string({ required_error: 'City is required' }),
    country: z.string({ required_error: 'Country Code is required' }),
    zip: z.string({ required_error: 'Zipcode is required' }),
    phone: z.string().optional()
  })
})

export async function validateRapydResponse<
  T extends AnyZodObject | ZodEffects<AnyZodObject>
>(schema: T, rapydResponse: unknown): Promise<z.infer<T>> {
  const res = await schema.safeParseAsync(rapydResponse)
  if (!res.success) {
    const errors: Record<string, string> = {}
    res.error.issues.forEach((i) => {
      errors[i.path[0]] = i.message
    })

    throw new Error('Invalid Rapyd Response', errors)
  }
  return res.data
}
