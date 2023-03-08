import { BaseError } from '../../shared/models/errors/BaseError'
export class AccountExistsException extends BaseError {
  constructor(name: string) {
    super(429, `Account with ${name} already exists`)
    Object.setPrototypeOf(this, AccountExistsException.prototype)
  }
}
