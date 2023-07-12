import { BadRequest, Conflict } from '@/errors'
import { User } from './model'
import crypto from 'crypto'
import { EmailService } from '@/email/service'

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
}

interface UserServiceDependencies {
  emailService: EmailService
}

export class UserService implements IUserService {
  constructor(private deps: UserServiceDependencies) {}

  public async create(args: CreateUserArgs): Promise<User> {
    const existingUser = await this.getByEmail(args.email)

    if (existingUser) {
      throw new Conflict('Email already in use')
    }

    return User.query().insertAndFetch(args)
  }

  public async getByEmail(email: string): Promise<User | undefined> {
    return User.query().findOne({ email })
  }

  public async getById(id: string): Promise<User | undefined> {
    return User.query().findById(id)
  }

  public async requestResetPassword(email: string): Promise<void> {
    const user = await this.getByEmail(email)

    if (!user) {
      return
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex')
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

  public async getUserByToken(token: string): Promise<User | undefined> {
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    const user = await User.query().findOne({ passwordResetToken })

    if (
      user?.passwordResetExpiresAt &&
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      return user
    }
  }
}
