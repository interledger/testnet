import { BaseError } from './base'

export class InternalServerError extends BaseError {
  constructor() {
    super(500, 'Internal Server Error')
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}
