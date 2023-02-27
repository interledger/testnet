import { Response } from '../Response'
export abstract class BaseError extends Error implements Response<unknown> {
  public readonly success: boolean
  public readonly statusCode: number
  public readonly message: string
  public readonly errors?: any

  constructor(statusCode: number, message: string, errors?: any) {
    super(message)
    this.statusCode = statusCode
    this.message = message
    this.success = false
    this.errors = errors

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
