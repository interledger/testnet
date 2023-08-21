import { User } from './model'

type GetKeys = keyof Pick<User, 'id' | 'paymentPointer'>

export interface IUserService {
  create: (paymentPointer: string) => Promise<User>
  get: (key: GetKeys, value: string) => Promise<User | undefined>
}

export class UserService implements IUserService {
  public async create(paymentPointer: string): Promise<User> {
    return await User.query().insert({
      paymentPointer
    })
  }

  public async get(key: GetKeys, value: string): Promise<User | undefined> {
    return await User.query().findOne(key, '=', value)
  }
}
