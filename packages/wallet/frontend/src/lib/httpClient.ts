import ky, { HTTPError } from 'ky'

import type { FieldPath, FieldValues } from 'react-hook-form'

export type SuccessResponse<T = undefined> = {
  message: string
  success: true
  result?: T
}

export type ErrorResponse<T = undefined> = {
  message: string
  success: false
  errors?: T extends FieldValues ? Record<FieldPath<T>, string> : undefined
}

export const httpClient = ky.extend({
  prefixUrl: process.env.NEXT_PUBLIC_BACKEND_URL,
  credentials: 'include',
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        request.headers.set('Content-Type', 'application/json')
      }
    ]
  }
})

// Type guard to check if the received object is an `ErrorResponse`. Note that
// we are only validating the main properties (`success`, `message`, `errors`).
// The `errors` property can be `undefined` or an `object`. If `errors` is an
// `object, we do not verify it's content.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isErrorResponse = <T = ErrorResponse<any>>(
  json: unknown
): json is T => {
  return (
    Boolean(json) &&
    typeof json === 'object' &&
    (json as ErrorResponse).success === false &&
    typeof (json as ErrorResponse).message === 'string' &&
    (typeof (json as ErrorResponse).errors === 'undefined' ||
      typeof (json as ErrorResponse).errors === 'object')
  )
}

export const generateBaseError = (message: string): ErrorResponse => ({
  success: false,
  message
})

/**
 * For `getError`'s generic we specify how the validation errors might look like
 * instead of passing the whole error type.
 *
 * Example:
 *
 * ```ts
 * type MyArgs = {foo: string}
 * type MyError = ErrorResponse<MyArgs>
 *
 * const error = getError<MyArgs>(receivedError, 'Fallback message')
 * //      ^ the type of error will be ErrorResponse<MyArgs | undefined>
 * ```
 */
export async function getError<T = undefined>(
  e: unknown,
  fallback: string
): Promise<ErrorResponse<T | undefined>> {
  if (e instanceof HTTPError) {
    const response = await e.response.json()
    if (isErrorResponse<ErrorResponse<T>>(response)) {
      return response
    }
    return generateBaseError(e.message)
  }
  return generateBaseError(fallback)
}
