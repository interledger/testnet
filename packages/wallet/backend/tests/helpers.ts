import { User } from '@/user/model'
export const createUser = (args: Partial<User>) => {
  return User.query().insertAndFetch(args)
}
