import { API_BASE_URL } from './constants.ts'
import { ErrorResponse, SuccessReponse } from './types.ts'

export class APIError extends Error {
  public readonly success: boolean = false
  public readonly errors?: Record<string, string>

  constructor(message: string, errors?: Record<string, string>) {
    super(message)

    this.errors = errors
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetcher<JSON = any>(
  input: string,
  options?: RequestInit
): Promise<SuccessReponse<JSON>> {
  const response = await fetch(API_BASE_URL + input, {
    credentials: 'include',
    ...options
  })
  const json = await response.json()
  if (!response.ok) {
    const error = json as ErrorResponse
    throw new APIError(error.message, error.errors)
  }

  return json
}
