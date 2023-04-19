import { BaseError } from './BaseError'
export class ConflictException extends BaseError {
  constructor(message: string) {
    super(409, message)
    Object.setPrototypeOf(this, ConflictException.prototype)
  }
}
