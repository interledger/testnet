import { WebhookType } from './validation'
import { Logger } from 'winston'
import { ISecondParty } from '@/transaction/service'
import { TransactionService } from '@/transaction/service'
import { WalletAddressService } from '@/walletAddress/service'
import { BadRequest } from '@shared/backend'
import { AccountService } from '@/account/service'
import { GateHubClient } from '@/gatehub/client'
import { SocketService } from '@/socket/service'
import { Env } from '@/config/env'
import { TransactionTypeEnum } from '@/gatehub/consts'
import { RhyzaAdminClient } from './admin-client'
import { NodeCacheInstance } from '@/utils/helpers'
import { Amount } from './types'

export enum EventType {
  PaymentIntentCreated = 'payment_intent.created',
  PaymentIntentCompleted = 'payment_intent.completed'
}

export interface WebHook {
  id: string
  type: EventType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
}

export interface AmountJSON {
  value: string
  assetCode: string
  assetScale: number
}

interface IRhyzaService {
  onWebHook: (wh: WebhookType) => Promise<void>
}

export class RhyzaService implements IRhyzaService {
  constructor(
    private socketService: SocketService,
    private gateHubClient: GateHubClient,
    private env: Env,
    private logger: Logger,
    private transactionService: TransactionService,
    private walletAddressService: WalletAddressService,
    private accountService: AccountService,
    private rhyzaAdminClient: RhyzaAdminClient
  ) {}

  public async onWebHook(wh: WebhookType): Promise<void> {
    this.logger.info(`received webhook of type ${wh.type} with id ${wh.id}`)
    switch (wh.type) {
      case EventType.PaymentIntentCreated:
        await this.handlePaymentIntentCreated(wh)
        break
      case EventType.PaymentIntentCompleted:
        await this.handlePaymentIntentCompleted(wh)
        break
    }
  }

  async getWalletAddress(wh: WebHook) {
    const id: string = wh.data?.walletAddressId || wh.data?.walletAddressId
    return await this.walletAddressService.findByIdWithoutValidation(id)
  }

  async getPaymentIntentSenders(id: string): Promise<ISecondParty | undefined> {
    try {
      const { result: payments } = await this.rhyzaAdminClient.listPayments({
        paymentIntentId: id,
        first: 100
      })

      const senderUrls = [
        ...new Set(payments.map((payment) => payment.senderWalletAddress))
      ]

      const walletAddresses = await Promise.all(
        senderUrls.map((url) => this.walletAddressService.getByUrl(url))
      )

      return {
        names: walletAddresses
          .flatMap((walletAddress) => {
            const user = walletAddress?.account?.user
            return user ? [`${user.firstName} ${user.lastName}`] : []
          })
          .join(', '),
        walletAddresses: senderUrls.join(', ')
      }
    } catch (e) {
      this.logger.warn('Error in getting payments by payment intent', e)
    }
  }

  private validateAmount(amount: Amount, eventType: EventType): boolean {
    if (BigInt(amount.value) > 0n) {
      return true
    }
    this.logger.warn(
      `${eventType} received with zero or negative value. Skipping interaction`
    )

    return false
  }

  private parseAmount(amount: AmountJSON): Amount {
    return { ...amount, value: amount.value }
  }

  private getAmountFromWebhook(wh: WebHook): Amount {
    let amount

    if ([EventType.PaymentIntentCompleted].includes(wh.type)) {
      amount = this.parseAmount(wh.data.receivedAmount as AmountJSON)
    }

    if (!amount) {
      throw new BadRequest('Unable to extract amount from webhook')
    }

    return amount
  }

  private amountToNumber(
    amount: Amount,
    toAssetScale: number = amount.assetScale
  ): number {
    const factor = 10 ** toAssetScale
    const scaledValue = Number(amount.value) * 10 ** -amount.assetScale
    const truncatedValue = Math.floor(scaledValue * factor) / factor
    return truncatedValue
  }

  private async handlePaymentIntentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)

    await this.transactionService.createIncomingTransaction(
      wh.data,
      walletAddress
    )
  }

  private async handlePaymentIntentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebhook(wh)
    const { gateHubWalletId: receiverWallet, userId } =
      await this.accountService.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    await this.gateHubClient.createTransaction({
      amount: this.amountToNumber(amount),
      vault_uuid: this.gateHubClient.getVaultUuid(amount.assetCode),
      receiving_address: receiverWallet,
      sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: TransactionTypeEnum.HOSTED,
      message: 'Transfer'
    })
    const secondParty = await this.getPaymentIntentSenders(wh.data.id)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      {
        status: 'COMPLETED',
        value: BigInt(amount.value),
        secondParty: secondParty?.names,
        secondPartyWA: secondParty?.walletAddresses
      }
    )

    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (userId && !isExchange)
      await this.socketService.emitMoneyReceivedByUserId(
        userId.toString(),
        amount
      )

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        amount
      )} from settlement account ${
        this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS
      } into ${receiverWallet} `
    )
  }
}
