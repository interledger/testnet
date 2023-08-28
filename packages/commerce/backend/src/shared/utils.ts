// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

export function deleteProperty<T, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: _, ...newObj } = obj
  return newObj
}

interface SuccessResponse extends Omit<TypedResponseBody, 'errors'> {}
interface ErrorResponse extends Omit<TypedResponseBody, 'data'> {}

export function toSuccessReponse<T>(
  data: T,
  message: string = 'SUCCESS'
): SuccessResponse {
  return {
    success: true,
    message: message,
    data
  }
}

export function toErrorResponse(
  errors: Record<string, string>,
  message: string = 'Error'
): ErrorResponse {
  return {
    success: false,
    message,
    errors
  }
}
