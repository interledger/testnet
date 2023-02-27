import { BaseError } from './BaseError'
export class BadRequestException extends BaseError {
  constructor(message: string, errors?: any) {
    super(400, message, errors)
    Object.setPrototypeOf(this, BadRequestException.prototype)
  }
}
