import { WebhookType } from './validation'
import { Logger } from 'winston'
import { ISecondParty } from '@/transaction/service'
import { TransactionService } from '@/transaction/service'
import { WalletAddressService } from '@/walletAddress/service'
import { BadRequest } from '@shared/backend'
import { AccountService } from '@/account/service'
import { GateHubClient } from '@/gatehub/client'
import { SocketService } from '@/socket/service'
import MessageType from '@/socket/messageType'
import { Env } from '@/config/env'
import { TransactionTypeEnum } from '@/gatehub/consts'
import { RhyzaAdminClient } from './admin-client'
import { NodeCacheInstance } from '@/utils/helpers'
import { Amount } from './types'

export enum EventType {
  PaymentIntentCreated = 'payment_intent.created',
  PaymentIntentCompleted = 'payment_intent.completed',
  PaymentCreated = 'payment.created',
  PaymentCompleted = 'payment.completed',
  PaymentFailed = 'payment.failed'
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
      case EventType.PaymentCreated:
        await this.handlePaymentCreated(wh)
        break
      case EventType.PaymentCompleted:
        await this.handlePaymentCompleted(wh)
        break
      case EventType.PaymentFailed:
        await this.handlePaymentFailed(wh)
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

    if ([EventType.PaymentCreated].includes(wh.type)) {
      amount = this.parseAmount(wh.data.debitAmount as AmountJSON)
    }

    if ([EventType.PaymentCompleted].includes(wh.type)) {
      amount = this.parseAmount(wh.data.debitAmount as AmountJSON)
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

  private async handlePaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const debitAmount = this.getAmountFromWebhook(wh)

    const {
      gateHubWalletId: sendingWallet,
      userId,
      gateHubUserId
    } = await this.accountService.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    await this.settleToSettlementWallet(
      debitAmount,
      sendingWallet,
      gateHubUserId
    )

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: BigInt(debitAmount.value) }
    )

    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (userId && !isExchange) {
      const messageType =
        wh.data.metadata?.type === 'instant'
          ? MessageType.MONEY_SENT_SHOP
          : MessageType.MONEY_SENT
      await this.socketService.emitMoneySentByUserId(
        userId.toString(),
        debitAmount,
        messageType
      )
    }

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        debitAmount
      )} from ${sendingWallet} to settlement account on ${
        EventType.PaymentCompleted
      }`
    )
  }

  private async handlePaymentFailed(wh: WebHook) {
    const sentAmount = this.parseAmount(wh.data.sentAmount as AmountJSON)

    if (BigInt(sentAmount.value) <= 0n) {
      await this.transactionService.updateTransaction(
        { paymentId: wh.data.id },
        { status: 'FAILED', value: 0n }
      )
      return
    }

    const walletAddress = await this.getWalletAddress(wh)
    const { gateHubWalletId: sendingWallet, gateHubUserId } =
      await this.accountService.getGateHubWalletAddress(walletAddress)

    // A partially sent payment still settles what actually left the wallet
    await this.settleToSettlementWallet(
      sentAmount,
      sendingWallet,
      gateHubUserId
    )

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: BigInt(sentAmount.value) }
    )

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        sentAmount
      )} from ${sendingWallet} to settlement account on ${
        EventType.PaymentFailed
      }`
    )
  }

  private async settleToSettlementWallet(
    amount: Amount,
    sendingWallet: string,
    gateHubUserId: string
  ) {
    await this.gateHubClient.createTransaction(
      {
        amount: this.amountToNumber(amount),
        vault_uuid: this.gateHubClient.getVaultUuid(amount.assetCode),
        sending_address: sendingWallet,
        receiving_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Transfer'
      },
      gateHubUserId
    )
  }

  private async handlePaymentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebhook(wh)
    const { gateHubWalletId, gateHubUserId } =
      await this.accountService.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      await this.rhyzaAdminClient.cancelPayment({
        paymentIntentId: wh.data.paymentIntentId,
        id: wh.data.id,
        reason: 'Invalid amount'
      })

      return
    }

    const secondParty = await this.getPaymentSecondPartyByPaymentIntentId(
      wh.data.paymentIntentId
    )

    await this.transactionService.createOutgoingTransaction(
      wh.data,
      walletAddress,
      secondParty
    )

    const balance = await this.getWalletBalance(
      gateHubWalletId,
      gateHubUserId,
      amount.assetCode
    )
    const amountValue = this.amountToNumber(amount)

    if (balance < amountValue) {
      this.logger.info(
        `Insufficient funds. Payment amount ${amountValue}, balance ${balance}`
      )
      await this.rhyzaAdminClient.cancelPayment({
        paymentIntentId: wh.data.paymentIntentId,
        id: wh.data.id,
        reason: 'Insufficient funds'
      })
      await this.transactionService.updateTransaction(
        { paymentId: wh.data.id },
        { status: 'FAILED', value: 0n }
      )
      return
    }

    await this.rhyzaAdminClient.approvePayment(
      wh.data.paymentIntentId,
      wh.data.id
    )

    this.logger.info(
      `Approved payment ${wh.data.id} of ${amountValue} from ${gateHubWalletId} on ${EventType.PaymentCreated}`
    )
  }

  private async getWalletBalance(
    gateHubWalletId: string,
    gateHubUserId: string,
    assetCode: string
  ) {
    const balances = await this.gateHubClient.getWalletBalance(
      gateHubWalletId,
      gateHubUserId
    )

    return Number(
      balances.find((balance) => balance.vault.asset_code === assetCode)
        ?.available ?? 0
    )
  }

  async getPaymentSecondPartyByPaymentIntentId(paymentIntentId: string) {
    try {
      const receiver =
        await this.rhyzaAdminClient.getPaymentIntentById(paymentIntentId)
      const receiverWA = await this.walletAddressService.getByUrl(
        receiver.walletAddress
      )

      const response: ISecondParty = {
        walletAddresses: receiver.walletAddress
      }

      if (receiverWA?.account?.user) {
        response.names = `${receiverWA.account.user.firstName} ${receiverWA.account.user.lastName}`
      }

      return response
    } catch (e) {
      this.logger.warn('Error on getting receiver wallet address', e)
    }
  }
}
