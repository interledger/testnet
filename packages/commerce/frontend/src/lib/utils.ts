import { type CxOptions, cx } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'
import { API_BASE_URL } from './constants.ts'
import { ErrorResponse } from './api/types.ts'
import { APIError } from './api/error.ts'

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetcher<JSON = any>(
  input: string,
  init?: RequestInit
): Promise<JSON> {
  const response = await fetch(API_BASE_URL + input, {
    credentials: 'include',
    ...init
  })
  const json = await response.json()
  if (!response.ok) {
    const error = json as ErrorResponse
    throw new APIError(error.success, error.message, error.errors)
  }

  return json
}
