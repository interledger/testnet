import { BaseError } from './base'

export class TooManyRequests extends BaseError {
  constructor(message: string) {
    super(429, message)
    Object.setPrototypeOf(this, TooManyRequests.prototype)
  }
}
