export abstract class BaseError
  extends Error
  implements TypedResponseBody<never>
{
  public readonly success: boolean
  public readonly statusCode: number
  public readonly message: string
  public readonly errors?: Record<string, string>

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string>
  ) {
    super(message)
    this.statusCode = statusCode
    this.message = message
    this.success = false
    this.errors = errors

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
