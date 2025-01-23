import type { User } from '@/user/model'
import { addSeconds } from 'date-fns'
import type { Env } from '@/config/env'
import type { Session } from '@/session/model'
import type { UserService } from '@/user/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { EmailService } from '@/email/service'
import { Logger } from 'winston'
import { Unauthorized, NotVerified, BadRequest } from '@shared/backend'
import { GateHubClient } from '@/gatehub/client'

interface resendVerifyEmailArgs {
  email: string
}
interface AuthorizeArgs {
  email: string
  password: string
}

interface SignUpArgs extends AuthorizeArgs {
  acceptedCardTerms?: boolean
}

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
    private gateHubClient: GateHubClient,
    private logger: Logger,
    private env: Env
  ) {}

  async signUp({
    email,
    password,
    acceptedCardTerms
  }: SignUpArgs): Promise<User> {
    const domain = email.split('@')[1]
    await this.emailService.verifyDomain(domain)

    if (
      this.env.NODE_ENV === 'production' &&
      this.env.GATEHUB_ENV === 'production'
    ) {
      const existingManagedUsers = await this.gateHubClient.getManagedUsers()
      const gateHubUser = existingManagedUsers.find(
        (user) => user.email === email
      )

      if (!gateHubUser) {
        throw new Error('You are not allowed to sign up.')
      }

      if (!acceptedCardTerms) {
        throw new BadRequest(
          'Additional terms and condition should be accepted'
        )
      }
    }

    const token = getRandomToken()
    const user = await this.userService.create({
      email,
      password,
      verifyEmailToken: hashToken(token),
      acceptedCardTerms
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
