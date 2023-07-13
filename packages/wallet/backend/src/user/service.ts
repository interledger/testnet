import { BadRequest, Conflict } from '@/errors'
import { User } from './model'
import { EmailService } from '@/email/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { Logger } from 'winston'

interface CreateUserArgs {
  email: string
  password: string
}

interface IUserService {
  create: (args: CreateUserArgs) => Promise<User>
  getByEmail(email: string): Promise<User | undefined>
  getById(id: string): Promise<User | undefined>
  requestResetPassword(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  validateToken(token: string): Promise<boolean>
}

interface UserServiceDependencies {
  emailService: EmailService
  logger: Logger
}

export class UserService implements IUserService {
  constructor(private deps: UserServiceDependencies) {}

  public async create(args: CreateUserArgs): Promise<User> {
    const existingUser = await this.getByEmail(args.email)

    if (existingUser) {
      throw new Conflict('Email already in use')
    }

    const token = getRandomToken()

    const user = await User.query().insertAndFetch({
      ...args,
      verifyEmailToken: hashToken(token)
    })

    await this.deps.emailService
      .sendVerifyEmail(args.email, token)
      .catch((e) => {
        this.deps.logger.error(
          `Error on sending verify email for user ${user.email}`,
          e
        )
      })

    return user
  }

  public async getByEmail(email: string): Promise<User | undefined> {
    return User.query().findOne({ email })
  }

  public async getById(id: string): Promise<User | undefined> {
    return User.query().findById(id)
  }

  public async requestResetPassword(email: string): Promise<void> {
    const user = await this.getByEmail(email)

    if (!user?.isEmailVerified) {
      this.deps.logger.info(
        `Reset email not sent. User with email ${email} not found (or not verified)`
      )
      return
    }

    const resetToken = getRandomToken()
    const passwordResetToken = hashToken(resetToken)
    const passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await User.query()
      .findById(user.id)
      .patch({ passwordResetToken, passwordResetExpiresAt })
    await this.deps.emailService.sendForgotPassword(email, resetToken)
  }

  public async resetPassword(token: string, password: string): Promise<void> {
    const user = await this.getUserByToken(token)

    if (!user) {
      throw new BadRequest('Invalid token')
    }

    await User.query().findById(user.id).patch({
      newPassword: password,
      passwordResetExpiresAt: null,
      passwordResetToken: null
    })
  }

  private async getUserByToken(token: string): Promise<User | undefined> {
    const passwordResetToken = hashToken(token)

    const user = await User.query().findOne({ passwordResetToken })

    if (
      user?.passwordResetExpiresAt &&
      user.passwordResetExpiresAt.getTime() > Date.now()
    ) {
      return user
    }
  }

  public async validateToken(token: string): Promise<boolean> {
    const user = await this.getUserByToken(token)

    return !!user
  }
}
