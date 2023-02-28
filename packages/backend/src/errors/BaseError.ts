export abstract class BaseError extends Error {
  public readonly statusCode: number
  public readonly message: string

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
    this.message = message

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
