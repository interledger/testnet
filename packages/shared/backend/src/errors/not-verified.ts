import { BaseError } from './base'

export class NotVerified extends BaseError {
  constructor(message?: string) {
    super(403, message ?? 'Not Validated', { email: 'Not verified' })
    Object.setPrototypeOf(this, NotVerified.prototype)
  }
}
