import { User } from './model'

type GetKeys = keyof Pick<User, 'id' | 'walletAddress'>

export interface IUserService {
  create: (walletAddress: string) => Promise<User>
  get: (key: GetKeys, value: string) => Promise<User | undefined>
}

export class UserService implements IUserService {
  public async create(walletAddress: string): Promise<User> {
    return await User.query().insert({
      walletAddress
    })
  }

  public async get(key: GetKeys, value: string): Promise<User | undefined> {
    return await User.query().findOne(key, '=', value)
  }
}
