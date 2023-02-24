import { BaseError } from '../../errors/BaseError'
export class UnauthorisedException extends BaseError {
  constructor(message: string) {
    super(401, message)
    Object.setPrototypeOf(this, UnauthorisedException.prototype)
  }
}
