import { BaseError } from './base'

export class Conflict extends BaseError {
  constructor(message: string) {
    super(409, message)
    Object.setPrototypeOf(this, Conflict.prototype)
  }
}
