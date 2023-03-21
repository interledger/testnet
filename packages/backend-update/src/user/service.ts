import { User } from './model'

interface IUserService {
  getByEmail(email: string): Promise<User | undefined>
}

export class UserService implements IUserService {
  public async getByEmail(email: string): Promise<User | undefined> {
    return User.query().findOne({ email })
  }
}
