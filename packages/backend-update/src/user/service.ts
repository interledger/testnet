import { User } from './model'

interface CreateArgs {
  email: string
  password: string
}

interface IUserService {
  getByEmail(email: string): Promise<User | undefined>
  create(args: CreateArgs): Promise<User>
}

export class UserService implements IUserService {
  public async create(args: CreateArgs): Promise<User> {
    return User.query().insertAndFetch(args)
  }

  public async getByEmail(email: string): Promise<User | undefined> {
    return User.query().findOne({ email })
  }
}
