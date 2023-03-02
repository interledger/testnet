import { BaseError } from '../../shared/models/errors/BaseError'
export class UnauthorisedException extends BaseError {
  constructor(message: string) {
    super(401, message)
    Object.setPrototypeOf(this, UnauthorisedException.prototype)
  }
}
