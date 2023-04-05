import { Conflict } from '@/errors'
import { User } from './model'

interface CreateUserArgs {
  email: string
  password: string
}

interface IUserService {
  getByEmail(email: string): Promise<User | undefined>
}

export class UserService implements IUserService {
  public async create(args: CreateUserArgs): Promise<User> {
    const existingUser = await this.getByEmail(args.email)

    if (existingUser) {
      throw new Conflict('Email already in use')
    }

    return User.query().insertAndFetch(args)
  }

  public async getByEmail(email: string): Promise<User | undefined> {
    return User.query().findOne({ email })
  }
}
