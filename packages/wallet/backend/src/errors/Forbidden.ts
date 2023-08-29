import { BaseError } from './Base'

export class Forbidden extends BaseError {
  constructor(message: string) {
    super(403, message)
    Object.setPrototypeOf(this, Forbidden.prototype)
  }
}
