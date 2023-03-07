import { BaseError } from './BaseError'
export class NotFoundException extends BaseError {
  constructor() {
    super(404, 'Not found')
    Object.setPrototypeOf(this, NotFoundException.prototype)
  }
}
