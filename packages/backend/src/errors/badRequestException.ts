import { BaseError } from './baseError'
export class BadRequestException extends BaseError {
  constructor(message: string) {
    super(400, message)
    Object.setPrototypeOf(this, BadRequestException.prototype)
  }
}
