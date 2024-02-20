import { BadRequest, Conflict } from '@/errors'
import { User } from './model'
import { EmailService } from '@/email/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import { AccountService } from '@/account/service'
import { WalletAddressService } from '@/walletAddress/service'
import { getRandomValues } from 'crypto'
import { RafikiClient } from '@/rafiki/rafiki-client'

interface CreateUserArgs {
  email: string
  password: string
  verifyEmailToken: string
}

interface IUserService {
  create: (args: CreateUserArgs) => Promise<User>
  getByEmail(email: string): Promise<User | undefined>
  getById(id: string): Promise<User | undefined>
  requestResetPassword(email: string): Promise<void>
  resetPassword(token: string, password: string): Promise<void>
  validateToken(token: string): Promise<boolean>
}

export class UserService implements IUserService {
  constructor(
    private emailService: EmailService,
    private accountService: AccountService,
    private walletAddressService: WalletAddressService,
    private rafikiClient: RafikiClient,
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

  public async getByWalletId(walletId: string): Promise<User | undefined> {
    return User.query().findOne({ rapydWalletId: walletId })
  }

  public async requestResetPassword(email: string): Promise<void> {
    const user = await this.getByEmail(email)

    if (!user?.isEmailVerified) {
      this.logger.info(
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
      passwordResetToken: null
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
  public async createDefaultAccount() {
    const existingUser = await this.getByEmail(
      this.env.DEFAULT_WALLET_ACCOUNT.email
    )

    if (existingUser) return

    await this.rafikiClient.createAsset('USD', 2)
    const defaultWalletUser = this.env.DEFAULT_WALLET_ACCOUNT
    const defaultBoutiqueUser = this.env.DEFAULT_BOUTIQUE_ACCOUNT

    let args = {
      ...defaultWalletUser,
      isEmailVerified: true
    }

    const createdWalletUser = await User.query().insertAndFetch(args)

    const wallertPromis = this.accountService.createDefaultAccount(
      createdWalletUser.id,
      false
    )

    args = {
      ...defaultBoutiqueUser,
      isEmailVerified: true
    }
    const createdBoutiqueUser = await User.query().insertAndFetch(args)

    const boutiquePromise = this.accountService.createDefaultAccount(
      createdBoutiqueUser.id,
      true
    )

    const [defaultAccount, defaultBoutiqueAccount] = await Promise.all([
      wallertPromis,
      boutiquePromise
    ])
    if (defaultAccount && defaultBoutiqueAccount) {
      const typedArray = new Uint32Array(1)
      getRandomValues(typedArray)

      await this.walletAddressService.create({
        accountId: defaultAccount.id,
        walletAddressName: typedArray[0].toString(16),
        publicName: 'Default Payment Pointer',
        userId: createdWalletUser.id,
        isWM: false
      })

      const boutiqueWallet = await this.walletAddressService.create({
        accountId: defaultBoutiqueAccount.id,
        walletAddressName: 'boutique',
        publicName: 'Default Payment Pointer',
        userId: createdBoutiqueUser.id,
        isWM: false
      })

      await this.walletAddressService.registerKey(
        createdBoutiqueUser.id,
        defaultBoutiqueAccount.id,
        boutiqueWallet.id,
        {
          publicKeyPEM: this.env.DEFAULT_BOUTIQUE_KEYS.public_key,
          privateKeyPEM: this.env.DEFAULT_BOUTIQUE_KEYS.private_key,
          keyId: this.env.DEFAULT_BOUTIQUE_KEYS.key_id
        }
      )
    }
  }
  public async verifyEmail(token: string): Promise<void> {
    const verifyEmailToken = hashToken(token)

    const user = await User.query().findOne({ verifyEmailToken })

    if (!user) {
      throw new BadRequest('Invalid token')
    }

    await User.query().findById(user.id).patch({
      isEmailVerified: true,
      verifyEmailToken: null
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
