import { GateHubClient } from '@/gatehub/client'
import { IFRAME_TYPE } from '@wallet/shared/src'
import { User } from '@/user/model'
import { NotFound } from '@shared/backend'
import {
  IAddUserToGatewayResponse,
  ICardTransactionWebhookData,
  IDepositWebhookData,
  IWebhookData
} from '@/gatehub/types'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import { AccountService } from '@/account/service'
import { WalletAddressService } from '@/walletAddress/service'
import { ICreateCustomerRequest } from '@/card/types'
import { Account } from '@/account/model'
import { WalletAddress } from '@/walletAddress/model'
import { getRandomValues } from 'crypto'
import { EmailService } from '@/email/service'
import { Transaction } from '@/transaction/model'
import { transformBalance } from '@/utils/helpers'
import { DepositTypeEnum } from '@/gatehub/consts'

export class GateHubService {
  constructor(
    private gateHubClient: GateHubClient,
    private logger: Logger,
    private env: Env,
    private accountService: AccountService,
    private walletAddressService: WalletAddressService,
    private emailService: EmailService
  ) {}

  async getIframeUrl(
    iframeType: IFRAME_TYPE,
    userId: string
  ): Promise<{ url: string; isApproved?: boolean; customerId?: string }> {
    const user = await User.query().findById(userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    let addUserToGatewayResponse = {}
    if (iframeType === 'onboarding' && !this.gateHubClient.isProduction) {
      const userState = await this.gateHubClient.getUserState(
        user.gateHubUserId
      )

      if (userState.verifications[0]?.status === 1) {
        addUserToGatewayResponse = await this.addUserToGateway(userId)
      }
    }

    const url = await this.gateHubClient.getIframeUrl(
      iframeType,
      user.gateHubUserId
    )

    return {
      url,
      ...addUserToGatewayResponse
    }
  }

  async handleWebhook(data: IWebhookData) {
    this.logger.debug(`GateHub webhook event received: ${JSON.stringify(data)}`)

    const gateHubUserId = data.user_uuid
    const user = await User.query().findOne({ gateHubUserId })
    if (!user) {
      this.logger.error(`User not found ${gateHubUserId}`)
      throw new NotFound('User not found')
    }

    if (data.event_type === 'core.deposit.completed') {
      const depositData = data.data as IDepositWebhookData
      if (depositData.deposit_type !== DepositTypeEnum.EXTERNAL) {
        // skip deposit webhooks processing hosted transactions
        return
      }
    }

    switch (data.event_type) {
      case 'id.verification.accepted': {
        // if user is already verified (for manual verify cases)
        // we skip the approveUserToGateway and overrideRiskLevel in addUserToGateway
        // but still execute the function in order to store gatehub userState
        if (!user.kycVerified && !user.lastName) {
          await this.addUserToGateway(user.id, true)
        }

        await this.markUserAsVerified({
          id: user.id,
          gateHubUserId: user.gateHubUserId
        })

        if (this.gateHubClient.isProduction) {
          await this.emailService.sendKYCVerifiedEmail(user.email)
        }
        break
      }
      case 'id.verification.action_required':
        await this.updateUserFlag(user.id, { kycVerified: false })
        if (data.data.message) {
          await this.emailService.sendActionRequiredEmail(
            user.email,
            data.data.message
          )
        }
        break
      case 'id.verification.rejected':
        await this.updateUserFlag(user.id, { isRejected: true })
        if (data.data.message) {
          await this.emailService.sendUserRejectedEmail(
            user.email,
            data.data.message
          )
        }
        break
      case 'id.document_notice.expired':
      case 'id.document_notice.warning':
        this.logger.info(
          `Document notice received for GateHub user ${gateHubUserId}`
        )
        await this.updateUserFlag(user.id, {
          isDocumentUpdateRequired: true
        })
        break
      case 'cards.transaction.authorization':
        await this.handleCardTransactionWebhook(
          user,
          data.data as ICardTransactionWebhookData
        )
        break
      case 'core.deposit.completed':
        await this.handleDepositWebhook(user, data.data as IDepositWebhookData)
        break
    }
  }

  private async handleCardTransactionWebhook(
    user: Partial<User>,
    data: ICardTransactionWebhookData
  ) {
    if (!user.cardWalletAddress) {
      this.logger.warn(
        `Card transaction received for user without card ${user.id}`,
        data
      )
      return
    }
    const walletAddress = await this.getCardWalletAddress(user.id!)

    if (!walletAddress) {
      this.logger.error(`Card wallet address not found ${user.id}`, data)
      return
    }
    const transaction = data.authorizationData

    await Transaction.query().insert({
      walletAddressId: walletAddress.id,
      accountId: walletAddress.accountId,
      paymentId: transaction.transactionId,
      assetCode: transaction.billingCurrency,
      value: transformBalance(Number(transaction.billingAmount), 2),
      type: 'OUTGOING',
      status: 'COMPLETED',
      description: '',
      source: 'Card'
    })
  }

  private async handleDepositWebhook(
    user: Partial<User>,
    data: IDepositWebhookData
  ) {
    const account = await this.accountService.getAccountByGatehubWalletId(
      user.id!,
      data.address
    )

    if (!account) {
      this.logger.error(
        `Account for user ${user.id} with account ${data.address} not found`,
        data
      )
      return
    }

    if (data.currency !== account.assetCode) {
      // Deposits should be allowed only in account currency
      this.logger.error(
        `Deposit does not match account currency for ${user.id} with account ${data.address}. Deposit currency ${data.currency}, account currency ${account.assetCode}`,
        data
      )
      return
    }

    await Transaction.query().insert({
      accountId: account.id,
      paymentId: data.tx_uuid,
      assetCode: data.currency,
      value: transformBalance(Number(data.amount.replace(',', '')), 2),
      type: 'INCOMING',
      status: 'COMPLETED',
      description: 'Deposit'
    })
  }

  private async getCardWalletAddress(userId: string) {
    const account = await Account.query().findOne({ userId, assetCode: 'EUR' })
    if (!account) {
      return
    }

    return WalletAddress.query().findOne({
      accountId: account.id,
      isCard: true
    })
  }
  async addUserToGateway(
    userId: string,
    isApproved = false
  ): Promise<IAddUserToGatewayResponse> {
    const user = await User.query().findById(userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const userState = await this.gateHubClient.getUserState(user.gateHubUserId)

    const userDetails: Partial<User> = {
      lastName: userState.profile.last_name,
      firstName: userState.profile.first_name,
      country: userState.profile.address_country_code,
      address: [
        userState.profile.address_street1,
        userState.profile.address_street2,
        userState.profile.address_city
      ]
        .filter(Boolean)
        .join(', ')
    }

    await User.query().findById(user.id).patch(userDetails)

    if (!isApproved) {
      isApproved = await this.gateHubClient.connectUserToGateway(
        user.gateHubUserId,
        this.env.GATEHUB_GATEWAY_UUID
      )
    }

    this.logger.info(
      `User ${user.id} with gatehub id ${user.gateHubUserId} CONNECTED TO GATEWAY`
    )

    if (isApproved) {
      await this.updateUserFlag(user.id, { kycVerified: true })
    }

    let customerId
    if (
      this.env.NODE_ENV === 'development' &&
      this.env.GATEHUB_ENV === 'sandbox'
    ) {
      customerId = await this.setupSandboxCustomer(
        user.id,
        user.gateHubUserId,
        userState.profile.first_name,
        userState.profile.last_name
      )
    } else if (
      this.env.NODE_ENV === 'production' &&
      this.env.GATEHUB_ENV === 'production'
    ) {
      customerId = await this.setupProdCustomer(
        user.id,
        user.email,
        `${userState.profile.first_name} ${userState.profile.last_name}`
      )
    } else {
      // We don't support cards on staging so we only create a default account and WA
      await this.createDefaultAccountAndWAForManagedUser(userId)
    }

    return { isApproved, customerId }
  }

  private async createDefaultAccountAndWAForManagedUser(
    userId: string,
    isDefaultCardsAccount?: boolean,
    walletAddressName?: string,
    walletAddressPublicName?: string,
    cardId?: string
  ): Promise<{ account: Account; walletAddress: WalletAddress }> {
    const account = await this.accountService.createDefaultAccount(
      userId,
      'EUR Account',
      isDefaultCardsAccount,
      cardId
    )
    if (!account) {
      throw new Error('Failed to create account for managed user')
    }

    const walletAddress = await this.walletAddressService.create({
      userId,
      accountId: account.id,
      walletAddressName:
        walletAddressName ||
        getRandomValues(new Uint32Array(1))[0].toString(16),
      publicName:
        walletAddressPublicName ||
        getRandomValues(new Uint32Array(1))[0].toString(16),
      isCard: !!walletAddressName
    })

    return { account, walletAddress }
  }

  private async setupSandboxCustomer(
    userId: string,
    managedUserId: string,
    firstName: string,
    lastName: string
  ): Promise<string> {
    const { account, walletAddress } =
      await this.createDefaultAccountAndWAForManagedUser(userId, true)

    const requestBody: ICreateCustomerRequest = {
      walletAddress: account.gateHubWalletId,
      account: {
        productCode: this.env.GATEHUB_ACCOUNT_PRODUCT_CODE,
        currency: 'EUR',
        card: {
          productCode: this.env.GATEHUB_CARD_PRODUCT_CODE
        }
      },
      nameOnCard: this.env.GATEHUB_NAME_ON_CARD,
      citizen: {
        name: firstName,
        surname: lastName
      }
    }

    const customer = await this.gateHubClient.createCustomer(
      managedUserId,
      requestBody
    )
    const customerId = customer.customers.id!
    const cardId = customer.customers.accounts![0].cards![0].id

    await User.query().findById(userId).patch({
      customerId,
      cardWalletAddress: walletAddress.url
    })

    await Account.query().findById(account.id).patch({
      cardId
    })

    return customerId
  }

  private async setupProdCustomer(
    userId: string,
    userEmail: string,
    walletAddressPublicName: string
  ): Promise<string> {
    const existingManagedUsers = await this.gateHubClient.getManagedUsers()
    // Managed user will always be found here since this check is also performed on sign up
    const gateHubUser = existingManagedUsers.find(
      (gateHubUser) => gateHubUser.email === userEmail
    )
    if (!gateHubUser) {
      throw new Error(`GateHub user with email ${userEmail} not found`)
    }

    const customerId = gateHubUser.meta.meta.customerId
    const cardWalletAddress = gateHubUser.meta.meta.paymentPointer

    const walletAddressName = cardWalletAddress.split('$ilp.dev/')[1] || ''
    const cards = await this.gateHubClient.getCardsByCustomer(
      customerId,
      gateHubUser.id
    )

    const activeCard = cards.find((card) => card.status !== 'SoftDelete')

    await this.createDefaultAccountAndWAForManagedUser(
      userId,
      true,
      walletAddressName,
      walletAddressPublicName,
      activeCard?.id
    )

    await User.query().findById(userId).patch({
      customerId,
      cardWalletAddress
    })

    return customerId
  }

  private async markUserAsVerified(
    user: Pick<User, 'id' | 'gateHubUserId'>
  ): Promise<void> {
    await this.updateUserFlag(user.id, {
      kycVerified: true,
      isRejected: false
    })

    this.logger.info(
      `USER ${user.id} with gatehub id ${user.gateHubUserId} VERIFIED`
    )
  }

  private async updateUserFlag(userId: string, changes: Partial<User>) {
    await User.query().findById(userId).patch(changes)
  }
}
