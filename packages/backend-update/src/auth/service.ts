import { User } from '@/user/model'
import { Conflict, Unauthorized } from '@/errors'
import { UserService } from '../user/service'
import addSeconds from 'date-fns/addSeconds'
import { Env } from '@/config/env'
import { Session } from '@/session/model'

interface CreateUserArgs {
  email: string
  password: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AuthorizeArgs extends CreateUserArgs {}
interface AuthorizeResult {
  user: User
  session: Session
}

interface IAuthService {
  createUser(args: CreateUserArgs): Promise<User>
  authorize(args: AuthorizeArgs): Promise<AuthorizeResult>
}

export class AuthService implements IAuthService {
  constructor(private userService: UserService, private env: Env) {}

  public async createUser(args: CreateUserArgs): Promise<User> {
    const existingUser = await this.userService.getByEmail(args.email)

    if (existingUser) {
      throw new Conflict('Email already in use')
    }

    return User.query().insertAndFetch(args)
  }

  public async authorize(args: AuthorizeArgs): Promise<AuthorizeResult> {
    const user = await User.query().findOne({ email: args.email })

    // TODO: Prevent timing attacks
    if (!user) {
      throw new Unauthorized('Invalid credentials')
    }

    const isValid = await user.verifyPassword(args.password)
    if (!isValid) {
      throw new Unauthorized('Invalid credentials')
    }

    const session = await user.$relatedQuery('sessions').insertGraphAndFetch({
      userId: user.id,
      expiresAt: addSeconds(new Date(), this.env.COOKIE_TTL)
    })

    return {
      user,
      session
    }
  }
}
