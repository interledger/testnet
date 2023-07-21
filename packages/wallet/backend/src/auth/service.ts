import type { User } from '@/user/model'
import { Unauthorized } from '@/errors'
import addSeconds from 'date-fns/addSeconds'
import type { Env } from '@/config/env'
import type { Session } from '@/session/model'
import type { UserService } from '@/user/service'

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
interface AuthServiceDependencies {
  userService: UserService
  env: Env
}

export class AuthService implements IAuthService {
  constructor(private deps: AuthServiceDependencies) {}

  public async authorize(args: AuthorizeArgs): Promise<AuthorizeResult> {
    const user = await this.deps.userService.getByEmail(args.email)

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
      expiresAt: addSeconds(new Date(), this.deps.env.COOKIE_TTL)
    })

    return {
      user,
      session
    }
  }

  public async logout(id: string): Promise<void> {
    const user = await this.deps.userService.getById(id)

    if (!user) {
      throw new Unauthorized('Invalid credentials')
    }

    await user.$relatedQuery('sessions').where({ userId: id }).update({
      expiresAt: new Date()
    })
  }
}
