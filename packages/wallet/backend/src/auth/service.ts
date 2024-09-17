import type { User } from '@/user/model'
import { addSeconds } from 'date-fns'
import type { Env } from '@/config/env'
import type { Session } from '@/session/model'
import type { UserService } from '@/user/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { EmailService } from '@/email/service'
import { Logger } from 'winston'
import { Unauthorized, NotVerified } from '@shared/backend'

interface resendVerifyEmailArgs {
  email: string
}
interface AuthorizeArgs {
  email: string
  password: string
}

interface SignUpArgs extends AuthorizeArgs {}

interface AuthorizeResult {
  user: User
  session: Session
}

interface IAuthService {
  authorize(args: AuthorizeArgs): Promise<AuthorizeResult>
  signUp(args: SignUpArgs): Promise<User>
}

export class AuthService implements IAuthService {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private logger: Logger,
    private env: Env
  ) {}

  async signUp({ email, password }: SignUpArgs): Promise<User> {
    const domain = email.split('@')[1]
    await this.emailService.verifyDomain(domain)

    const token = getRandomToken()
    const user = await this.userService.create({
      email,
      password,
      verifyEmailToken: hashToken(token)
    })

    await this.emailService.sendVerifyEmail(email, token).catch((e) => {
      this.logger.error(
        `Error on sending verify email for user ${user.email}`,
        e
      )
    })

    return user
  }

  public async resendVerifyEmail({
    email
  }: resendVerifyEmailArgs): Promise<void> {
    const user = await this.userService.getByEmail(email)

    // TODO: Prevent timing attacks
    if (!user) {
      this.logger.info(
        `Invalid account on resend verify account email: ${email}`
      )
      return
    }
    const token = getRandomToken()
    await this.userService.resetVerifyEmailToken({
      email,
      verifyEmailToken: hashToken(token)
    })

    await this.emailService.sendVerifyEmail(email, token).catch((e) => {
      this.logger.error(
        `Error on sending verify email for user ${user.email}`,
        e
      )
    })
  }

  public async authorize(args: AuthorizeArgs): Promise<AuthorizeResult> {
    const user = await this.userService.getByEmail(args.email)

    // TODO: Prevent timing attacks
    if (!user) {
      throw new Unauthorized('Invalid credentials.')
    }

    const isValid = await user.verifyPassword(args.password)
    if (!isValid) {
      throw new Unauthorized('Invalid credentials.')
    }

    if (!user.isEmailVerified) {
      throw new NotVerified('Email address is not verified.')
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

  public async logout(userId: string): Promise<void> {
    const user = await this.userService.getById(userId)

    if (!user) {
      throw new Unauthorized('Invalid credentials')
    }

    await user.$relatedQuery('sessions').delete()
  }
}
