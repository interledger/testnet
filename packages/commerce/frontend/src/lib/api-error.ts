export class APIError extends Error {
  public readonly success!: boolean
  public readonly errors?: Record<string, string>

  constructor(
    success: boolean,
    message: string,
    errors?: Record<string, string>
  ) {
    super(message)
    this.success = success
    this.errors = errors
  }
}
