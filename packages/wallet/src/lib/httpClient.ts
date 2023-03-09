import ky from 'ky'

import type { FieldPath } from 'react-hook-form'
import { input, ZodTypeAny } from 'zod/lib/types'

export type BaseResponse = {
  message: string
}

export type SuccessResponse<T = undefined> = BaseResponse & {
  success: true
  data?: T
}

export type ErrorResponse<T extends ZodTypeAny> = BaseResponse & {
  success: false
  errors?: Record<FieldPath<input<T>>, string>
}

export const httpClient = ky.extend({
  prefixUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
})
