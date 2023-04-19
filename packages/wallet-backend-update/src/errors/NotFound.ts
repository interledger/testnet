import { BaseError } from './Base'

export class NotFound extends BaseError {
  constructor(message?: string) {
    super(404, message ?? 'Not Found')
    Object.setPrototypeOf(this, NotFound.prototype)
  }
}
