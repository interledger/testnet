import { z } from 'zod'

export const kycSchema = z.object({
  document_type: z.string({ required_error: 'document type is required' }),
  front_side_image: z.string({
    required_error: 'front side image is required'
  }),
  front_side_image_mime_type: z.string({
    required_error: 'front side image mime type is required'
  }),
  face_image: z.string({ required_error: 'face image is required' }),
  face_image_mime_type: z.string({
    required_error: 'face image mime type is required'
  })
})
