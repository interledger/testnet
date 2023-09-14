import { BaseError } from './base'

export class NotFound extends BaseError {
  constructor(message?: string) {
    super(404, message ?? 'Not Found')
    Object.setPrototypeOf(this, NotFound.prototype)
  }
}
