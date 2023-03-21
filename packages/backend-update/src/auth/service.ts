import { User } from '@/user/model'
import { Conflict } from '@/errors'
import { UserService } from '../user/service'

interface RegisterArgs {
  email: string
  password: string
}

interface IAuthService {
  signUp(args: RegisterArgs): Promise<User>
}

export class AuthService implements IAuthService {
  constructor(private userService: UserService) {}

  public async signUp(args: RegisterArgs): Promise<User> {
    const existingUser = await this.userService.getByEmail(args.email)

    if (existingUser) {
      throw new Conflict('Email already in use')
    }

    return this.userService.create(args)
  }
}
