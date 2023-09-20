import { BaseError } from './base'

export class Unauthorized extends BaseError {
  constructor(message: string) {
    super(401, message)
    Object.setPrototypeOf(this, Unauthorized.prototype)
  }
}
