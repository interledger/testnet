import { BaseError } from './BaseError'
export class NotFoundException extends BaseError {
  constructor(message?: string) {
    super(404, message ?? 'Not found')
    Object.setPrototypeOf(this, NotFoundException.prototype)
  }
}
