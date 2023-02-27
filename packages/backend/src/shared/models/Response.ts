export interface Response<T> {
  success: boolean
  message?: string
  errors?: Record<string, string>
  data?: T
}
