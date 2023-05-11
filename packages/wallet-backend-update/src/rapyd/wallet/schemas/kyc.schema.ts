import { z } from 'zod'
export const kycSchema = z.object({
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
