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

export function extractUuidFromUrl(url: string): string | null {
  const regex =
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const match = url.match(regex)
  return match ? match[0] : null
}

export function replaceHost(text: string): string {
  return text.replace('localhost', 'rafiki-auth')
}
