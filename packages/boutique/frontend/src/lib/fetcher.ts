import type { FieldValues, FieldPath } from 'react-hook-form'
import { API_BASE_URL } from './constants.ts'
import { ErrorResponse, SuccessResponse } from './types.ts'

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type Errors<T = undefined> = T extends FieldValues
  ? Record<FieldPath<T>, string>
  : undefined

export class APIError<T = undefined> extends Error {
  public readonly success: boolean = false
  public readonly errors?: Errors<T>

  constructor(message: string, errors: Errors<T>) {
    super(message)
    this.errors = errors
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetcher<JSON = any>(
  input: string,
  options?: RequestInit
): Promise<SuccessResponse<JSON>> {
  const response = await fetch(API_BASE_URL + input, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  })
  const json = await response.json()
  if (!response.ok) {
    const error = json as ErrorResponse
    throw new APIError(error.message, error.errors as unknown as Errors)
  }

  return json
}
