import { User } from './model'
import { EmailService } from '@/email/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { Logger } from 'winston'
import { BadRequest, Conflict } from '@shared/backend'
import { GateHubClient } from '@/gatehub/client'
import { Env } from '@/config/env'

interface CreateUserArgs {
  email: string
  password: string
  verifyEmailToken: string
  acceptedCardTerms?: boolean
}

interface VerifyEmailArgs {
  email: string
  verifyEmailToken: string
}

interface IUserService {
  create: (args: CreateUserArgs) => Promise<User>
  getByEmail(email: string): Promise<User | undefined>
  getById(id: string): Promise<User | undefined>
  requestResetPassword(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  validateToken(token: string): Promise<boolean>
  resetVerifyEmailToken: (args: VerifyEmailArgs) => Promise<void>
}

export class UserService implements IUserService {
  constructor(
    private emailService: EmailService,
    private gateHubClient: GateHubClient,
    private logger: Logger,
    private env: Env
  ) {}

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
      this.logger.info(
        `Reset email not sent. User with email ${email} not found`
      )
      return
    }

    const resetToken = getRandomToken()
    const passwordResetToken = hashToken(resetToken)
    const passwordResetExpiresAt = new Date(Date.now() + 8 * 3600 * 1000)

    await User.query()
      .findById(user.id)
      .patch({ passwordResetToken, passwordResetExpiresAt })
    await this.emailService.sendForgotPassword(email, resetToken)
  }

  public async resetPassword(token: string, password: string): Promise<void> {
    const user = await this.getUserByToken(token)

    if (!user) {
      throw new BadRequest('Invalid token')
    }

    await User.query().findById(user.id).patch({
      newPassword: password,
      passwordResetExpiresAt: null,
      passwordResetToken: null,
      isEmailVerified: true
    })
  }

  public async changePassword(
    oldPassword: string,
    newPassword: string,
    userId: string
  ): Promise<void> {
    const user = await this.getById(userId)

    if (!user) {
      throw new BadRequest('Invalid user')
    }

    const isValid = await user.verifyPassword(oldPassword)
    if (!isValid) {
      throw new BadRequest('Old password is incorrect')
    }

    await User.query().findById(user.id).patch({
      newPassword: newPassword,
      passwordResetExpiresAt: null,
      passwordResetToken: null
    })
  }

  public async validateToken(token: string): Promise<boolean> {
    const user = await this.getUserByToken(token)

    return !!user
  }

  public async verifyEmail(token: string): Promise<void> {
    const verifyEmailToken = hashToken(token)

    const user = await User.query().findOne({ verifyEmailToken })

    if (!user) {
      throw new BadRequest('Invalid token')
    }

    let gateHubUser
    if (
      this.env.NODE_ENV === 'production' &&
      this.env.GATEHUB_ENV === 'production'
    ) {
      const existingManagedUsers = await this.gateHubClient.getManagedUsers()
      gateHubUser = existingManagedUsers.find(
        (gateHubUser) => gateHubUser.email === user.email
      )

      if (!gateHubUser) {
        gateHubUser = await this.gateHubClient.createManagedUser(user.email)
      }
    } else {
      gateHubUser = await this.gateHubClient.createManagedUser(user.email)
    }

    await User.query().findById(user.id).patch({
      isEmailVerified: true,
      verifyEmailToken: null,
      gateHubUserId: gateHubUser.id
    })
  }

  public async resetVerifyEmailToken(args: VerifyEmailArgs): Promise<void> {
    const user = await this.getByEmail(args.email)

    if (!user) {
      this.logger.info(
        `Invalid account on resend verify account email: ${args.email}`
      )
      return
    }

    await User.query().findById(user.id).patch({
      isEmailVerified: false,
      verifyEmailToken: args.verifyEmailToken
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
}
