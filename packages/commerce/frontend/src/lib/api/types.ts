export interface ErrorResponse {
  message: string
  success: false
  errors?: Record<string, string>
}
