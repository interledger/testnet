import { BaseError } from './base'

export class BadRequest extends BaseError {
  constructor(message: string, errors?: Record<string, string>) {
    super(400, message, errors)
    Object.setPrototypeOf(this, BadRequest.prototype)
  }
}
