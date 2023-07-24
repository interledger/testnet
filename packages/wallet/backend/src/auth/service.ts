import type { User } from '@/user/model'
import { Unauthorized } from '@/errors'
import addSeconds from 'date-fns/addSeconds'
import type { Env } from '@/config/env'
import type { Session } from '@/session/model'
import type { UserService } from '@/user/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { EmailService } from '@/email/service'
import { Logger } from 'winston'

interface AuthorizeArgs {
  email: string
  password: string
}

interface SignupArgs extends AuthorizeArgs {}

interface AuthorizeResult {
  user: User
  session: Session
}

interface IAuthService {
  authorize(args: AuthorizeArgs): Promise<AuthorizeResult>
  signup(args: SignupArgs): Promise<User>
}
interface AuthServiceDependencies {
  userService: UserService
  emailService: EmailService
  logger: Logger
  env: Env
}

export class AuthService implements IAuthService {
  constructor(private deps: AuthServiceDependencies) {}

  async signup({ email, password }: SignupArgs): Promise<User> {
    const token = getRandomToken()

    const user = await this.deps.userService.create({
      email,
      password,
      verifyEmailToken: hashToken(token)
    })

    await this.deps.emailService.sendVerifyEmail(email, token).catch((e) => {
      this.deps.logger.error(
        `Error on sending verify email for user ${user.email}`,
        e
      )
    })

    return user
  }

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

  public async logout(userId: string): Promise<void> {
    const user = await this.deps.userService.getById(userId)

    if (!user) {
      throw new Unauthorized('Invalid credentials')
    }

    await user.$relatedQuery('sessions').delete()
  }
}
