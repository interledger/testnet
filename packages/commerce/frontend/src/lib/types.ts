export interface ErrorResponse {
  success: false
  message: string
  errors: Record<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SuccessReponse<T = any> {
  success: true
  message: string
  data: T
}
