import { User } from '@/user/model'
import { Unauthorized } from '@/errors'
import addSeconds from 'date-fns/addSeconds'
import { Env } from '@/config/env'
import { Session } from '@/session/model'

interface AuthorizeArgs {
  email: string
  password: string
}
interface AuthorizeResult {
  user: User
  session: Session
}

interface IAuthService {
  authorize(args: AuthorizeArgs): Promise<AuthorizeResult>
}

export class AuthService implements IAuthService {
  constructor(private env: Env) {}

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
