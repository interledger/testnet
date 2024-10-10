import { GateHubClient } from '@/gatehub/client'
import { IFRAME_TYPE } from '@wallet/shared/src'
import { User } from '@/user/model'
import { NotFound } from '@shared/backend'
import { IGetUserStateResponse, IWebhookDate } from '@/gatehub/types'
import { Logger } from 'winston'
import { Env } from '@/config/env'
import { AccountService } from '@/account/service'
import { WalletAddressService, createWalletAddressIfFalsy } from '@/walletAddress/service'
import { ICreateCustomerRequest } from '@/card/types'

export class GateHubService {
  constructor(
    private gateHubClient: GateHubClient,
    private logger: Logger,
    private env: Env,
    private accountService?: AccountService,
    private walletAddressService?: WalletAddressService
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

  async addUserToGateway(userId: string) {
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

    if (this.env.GATEHUB_ENV !== 'production') {
      await this.setupNonProdUser(user.id, user.gateHubUserId, userState)
    }

    return isUserApproved
  }

  private async setupNonProdUser(
    userId: string,
    managedUserId: string,
    userState: IGetUserStateResponse
  ) {
    if (!this.accountService || !this.walletAddressService) {
      throw new Error(
        'AccountService and WalletAddressService must be provided in sandbox environment.'
      )
    }

    const account = await this.accountService.createDefaultAccount(
      userId,
      'EUR Account'
    )
    if (!account) {
      throw new Error('Failed to create account for managed user')
    }

    const paymentPointer = await createWalletAddressIfFalsy({
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
        },
      },
      // TODO change this after merging script branch to main
      nameOnCard: 'INTERLEDGER',
      citizen: {
        name: userState.profile.first_name,
        surname: userState.profile.last_name
      }
    }

    const customer = await this.gateHubClient.createCustomer(managedUserId, requestBody)
    const customerId = customer.customers.id!

    const userDetails: Partial<User> = {
      customerId
    }
    await User.query().findById(userId).patch(userDetails)

    await this.gateHubClient.updateMetaForManagedUser(managedUserId, {
      paymentPointer: paymentPointer.url,
      customerId
    })
    
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
