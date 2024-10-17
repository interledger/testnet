import { GateHubClient } from '@/gatehub/client'
import { IFRAME_TYPE } from '@wallet/shared/src'
import { User } from '@/user/model'
import { NotFound } from '@shared/backend'
import { IGetUserStateResponse, IWebhookDate } from '@/gatehub/types'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import { AccountService } from '@/account/service'
import {
  WalletAddressService,
  createWalletAddressIfFalsy
} from '@/walletAddress/service'
import { ICreateCustomerRequest } from '@/card/types'
import { Account } from '@/account/model'

export class GateHubService {
  constructor(
    private gateHubClient: GateHubClient,
    private logger: Logger,
    private env: Env,
    private accountService: AccountService,
    private walletAddressService: WalletAddressService
  ) {}

  async getIframeUrl(iframeType: IFRAME_TYPE, userId: string): Promise<string> {
    const user = await User.query().findById(userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const url = await this.gateHubClient.getIframeUrl(
      iframeType,
      user.gateHubUserId
    )

    return url
  }

  async handleWebhook(data: IWebhookDate) {
    this.logger.debug(`GateHub webhook event received: ${JSON.stringify(data)}`)
    // TODO: handle other webhook types
    switch (data.event_type) {
      case 'id.verification.accepted':
        await this.markUserAsVerified(data.user_uuid)
        break
    }
  }

  async addUserToGateway(
    userId: string
  ): Promise<{ isUserApproved: boolean; customerId?: string }> {
    const user = await User.query().findById(userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const isUserApproved = await this.gateHubClient.connectUserToGateway(
      user.gateHubUserId,
      this.env.GATEHUB_GATEWAY_UUID
    )

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

    if (isUserApproved) {
      userDetails.kycVerified = true
    }

    await User.query().findById(user.id).patch(userDetails)

    let customerId
    if (
      this.env.NODE_ENV === 'development' &&
      this.env.GATEHUB_ENV === 'sandbox'
    ) {
      customerId = await this.setupSandboxCustomer(
        user.id,
        user.gateHubUserId,
        userState
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
      // We don't support cards on staging so we only create a default account
      await this.createDefaultAccountForManagedUser(userId, false)
    }

    return { isUserApproved, customerId }
  }

  private async createDefaultAccountForManagedUser(
    userId: string,
    isDefaultCardsAccount?: boolean
  ): Promise<Account> {
    const account = await this.accountService.createDefaultAccount(
      userId,
      'EUR Account',
      isDefaultCardsAccount
    )
    if (!account) {
      throw new Error('Failed to create account for managed user')
    }

    return account
  }

  private async setupSandboxCustomer(
    userId: string,
    managedUserId: string,
    userState: IGetUserStateResponse
  ): Promise<string> {
    if (!this.accountService || !this.walletAddressService) {
      throw new Error(
        'AccountService and WalletAddressService must be provided in sandbox environment.'
      )
    }

    const account = await this.createDefaultAccountForManagedUser(userId, true)

    await createWalletAddressIfFalsy({
      userId,
      accountId: account.id,
      publicName: 'Cards Sandbox Payment Pointer',
      walletAddressService: this.walletAddressService
    })

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
        name: userState.profile.first_name,
        surname: userState.profile.last_name
      }
    }

    const customer = await this.gateHubClient.createCustomer(
      managedUserId,
      requestBody
    )
    const customerId = customer.customers.id!
    const cardId = customer.customers.accounts![0].cards![0].id

    await User.query().findById(userId).patch({
      customerId
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
    if (!this.accountService || !this.walletAddressService) {
      throw new Error(
        'AccountService and WalletAddressService must be provided in sandbox environment.'
      )
    }

    const existingManagedUsers = await this.gateHubClient.getManagedUsers()
    // Managed user will always be found here since this check is also performed on sign up
    const gateHubUser = existingManagedUsers.find(
      (gateHubUser) => gateHubUser.email === userEmail
    )

    const account = await this.createDefaultAccountForManagedUser(userId, true)

    const ppName =
      gateHubUser!.meta.meta.paymentPointer.split('$ilp.dev/')[1] || ''
    await this.walletAddressService.create({
      userId,
      accountId: account.id,
      walletAddressName: ppName,
      publicName: walletAddressPublicName
    })

    const customerId = gateHubUser!.meta.meta.customerId

    await User.query().findById(userId).patch({
      customerId
    })

    return customerId
  }

  private async markUserAsVerified(uuid: string): Promise<void> {
    const user = await User.query().findOne({ gateHubUserId: uuid })

    if (!user) {
      throw new NotFound('User not found')
    }

    await User.query().findById(user.id).patch({
      kycVerified: true
    })
  }
}
