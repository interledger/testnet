export interface TestnetResponse<T> {
  success: boolean
  message?: string
  errors?: Record<string, string>
  data?: T
}
