import { Env } from '@/config/env'
import { WalletAddress } from '@/walletAddress/model'
import { TransactionService } from '@/transaction/service'
import { Logger } from 'winston'
import { RafikiClient } from './rafiki-client'
import { SocketService } from '@/socket/service'
import { NodeCacheInstance } from '@/utils/helpers'
import { WalletAddressService } from '@/walletAddress/service'
import { Account } from '@/account/model'
import MessageType from '@/socket/messageType'
import { BadRequest } from '@shared/backend'
import { GateHubClient } from '@/gatehub/client'
import { HOSTED_TRANSACTION_TYPE } from '@/gatehub/consts'
import {
  WebhookType,
  incomingPaymentWebhookSchema,
  incomingPaymentCompletedWebhookSchema,
  outgoingPaymentWebhookSchema,
  walletAddressWebhookSchema,
  validateInput
} from './validation'

export enum EventType {
  IncomingPaymentCreated = 'incoming_payment.created',
  IncomingPaymentCompleted = 'incoming_payment.completed',
  IncomingPaymentExpired = 'incoming_payment.expired',
  OutgoingPaymentCreated = 'outgoing_payment.created',
  OutgoingPaymentCompleted = 'outgoing_payment.completed',
  OutgoingPaymentFailed = 'outgoing_payment.failed',
  WalletAddressNotFound = 'wallet_address.not_found'
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

export interface Amount {
  value: bigint
  assetCode: string
  assetScale: number
}

export enum PaymentType {
  FixedSend = 'FixedSend',
  FixedDelivery = 'FixedDelivery'
}
export interface IIncomingPayment {
  id: string
  walletAddressId: string
  createdAt: string
  expiresAt: string
  receivedAmount: Amount
  completed: boolean
  updatedAt: string
  metadata: {
    description: string
  }
}
export interface IIncomingPaymentCompleted {
  id: string
  walletAddressId: string
  createdAt: string
  expiresAt: string
  incomingAmount: Amount
  receivedAmount: Amount
  completed: boolean
  updatedAt: string
  metadata: {
    description: string
  }
}
export interface IOutgoingPayment {
  id: string
  walletAddressId: string
  client: string
  state: string
  receiver: string
  debitAmount: Amount
  receiveAmount: Amount
  sentAmount: Amount
  stateAttempts: Amount
  createdAt: string
  expiresAt: string
  balance: string
  metadata: {
    description: string
  }
  peerId: string
}
export interface IWalletAddress {
  walletAddressUrl: string
}

export interface IncomingPaymentWebhook extends WebHook {
  type:
    | EventType.IncomingPaymentCreated
    | EventType.IncomingPaymentCompleted
    | EventType.IncomingPaymentExpired
  data: IIncomingPayment | IIncomingPaymentCompleted
}

export interface OutgoingPaymentWebhook extends WebHook {
  type:
    | EventType.OutgoingPaymentCreated
    | EventType.OutgoingPaymentCompleted
    | EventType.OutgoingPaymentFailed
  data: IOutgoingPayment
}
export interface WalletAddressWebhook extends WebHook {
  type: EventType.WalletAddressNotFound
  data: IWalletAddress
}

export type Quote = {
  id: string
  paymentType: PaymentType
  walletAddressId: string
  receiver: string
  debitAmount: Amount
  receiveAmount: Amount
  maxPacketAmount?: bigint
  minExchangeRate?: number
  lowEstimatedExchangeRate?: number
  highEstimatedExchangeRate?: number
  createdAt: string
  expiresAt: string
}

type Fee = {
  fixed: number
  percentage: number
  scale: number
}

export type Fees = Record<string, Fee>

const isValidEventType = (value: string): value is EventType => {
  return Object.values(EventType).includes(value as EventType)
}
interface IRafikiService {
  onWebHook: (wh: WebhookType) => Promise<void>
}

export class RafikiService implements IRafikiService {
  constructor(
    private socketService: SocketService,
    private gateHubClient: GateHubClient,
    private env: Env,
    private logger: Logger,
    private rafikiClient: RafikiClient,
    private transactionService: TransactionService,
    private walletAddressService: WalletAddressService
  ) {}

  public async onWebHook(wh: WebhookType): Promise<void> {
    this.logger.info(
      `received webhook of type : ${wh.type} for : ${
        wh.type === EventType.WalletAddressNotFound ? '' : `${wh.id}}`
      }`
    )
    if (!isValidEventType(wh.type)) {
      throw new BadRequest(`unknown event type, ${wh.type}`)
    }
    const isValid = await this.isValidInput(wh)
    if (!isValid) {
      throw new BadRequest(`Invalid Input for ${wh.type}`)
    }
    switch (wh.type) {
      case EventType.OutgoingPaymentCreated:
        await this.handleOutgoingPaymentCreated(wh)
        break
      case EventType.OutgoingPaymentCompleted:
        await this.handleOutgoingPaymentCompleted(wh)
        break
      case EventType.OutgoingPaymentFailed:
        await this.handleOutgoingPaymentFailed(wh)
        break
      case EventType.IncomingPaymentCompleted:
        await this.handleIncomingPaymentCompleted(wh)
        break
      case EventType.IncomingPaymentCreated:
        await this.handleIncomingPaymentCreated(wh)
        break
      case EventType.IncomingPaymentExpired:
        await this.handleIncomingPaymentExpired(wh)
        break
      case EventType.WalletAddressNotFound:
        this.logger.warn(`${EventType.WalletAddressNotFound} received`)
        break
    }
  }

  private async isValidInput(wh: WebhookType) {
    let validInput = false

    switch (wh.type) {
      case EventType.OutgoingPaymentCreated:
      case EventType.OutgoingPaymentCompleted:
      case EventType.OutgoingPaymentFailed:
        validInput = await validateInput(outgoingPaymentWebhookSchema, wh)
        break
      case EventType.IncomingPaymentCompleted:
        validInput = await validateInput(
          incomingPaymentCompletedWebhookSchema,
          wh
        )
        break
      case EventType.IncomingPaymentCreated:
      case EventType.IncomingPaymentExpired:
        validInput = await validateInput(incomingPaymentWebhookSchema, wh)
        break
      case EventType.WalletAddressNotFound:
        validInput = await validateInput(walletAddressWebhookSchema, wh)
        break
    }
    return validInput
  }

  private parseAmount(amount: AmountJSON): Amount {
    return { ...amount, value: BigInt(amount.value) }
  }

  private getAmountFromWebHook(wh: WebHook): Amount {
    let amount
    if (
      [
        EventType.OutgoingPaymentCreated,
        EventType.OutgoingPaymentCompleted,
        EventType.OutgoingPaymentFailed
      ].includes(wh.type)
    ) {
      amount = this.parseAmount(wh.data.debitAmount as AmountJSON)
    }

    if (
      [
        EventType.IncomingPaymentCompleted,
        EventType.IncomingPaymentExpired
      ].includes(wh.type)
    ) {
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

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebHook(wh)

    const { gateHubWalletId: receiverWallet, userId } =
      await this.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      //* Only in case the expired incoming payment has no money received will it be set as expired.
      //* Otherwise, it will complete, even if not all the money is yet sent.
      if (wh.type === EventType.IncomingPaymentExpired) {
        await this.transactionService.updateTransaction(
          { paymentId: wh.data.id },
          { status: 'EXPIRED' }
        )
      }
      return
    }

    await this.gateHubClient.createTransaction({
      amount: this.amountToNumber(amount),
      vault_uuid: this.getVaultUuid(amount.assetCode),
      receiving_address: receiverWallet,
      sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: HOSTED_TRANSACTION_TYPE,
      message: 'Transfer'
    })

    await this.rafikiClient.withdrawLiqudity(wh.id)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: amount.value }
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

  private async handleIncomingPaymentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)

    await this.transactionService.createIncomingTransaction(
      wh.data,
      walletAddress
    )
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebHook(wh)

    const { gateHubWalletId } =
      await this.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    await this.transactionService.createOutgoingTransaction(
      wh.data,
      walletAddress
    )

    await this.rafikiClient.depositLiquidity(wh.id)

    this.logger.info(
      `Succesfully held ${this.amountToNumber(
        amount
      )} in ${gateHubWalletId}  on ${EventType.OutgoingPaymentCreated}`
    )
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    const {
      gateHubWalletId: sendingWallet,
      userId,
      gateHubUserId
    } = await this.getGateHubWalletAddress(walletAddress)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    await this.gateHubClient.createTransaction(
      {
        amount: this.amountToNumber(debitAmount),
        vault_uuid: this.getVaultUuid(debitAmount.assetCode),
        sending_address: sendingWallet,
        receiving_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: HOSTED_TRANSACTION_TYPE,
        message: 'Transfer'
      },
      gateHubUserId
    )

    if (wh.data.balance !== '0') {
      await this.rafikiClient.withdrawLiqudity(wh.id)
    }

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: debitAmount.value }
    )

    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (userId && !isExchange) {
      const messageType =
        wh.data.metadata.type === 'instant'
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
        EventType.OutgoingPaymentCompleted
      }`
    )
  }

  private async handleOutgoingPaymentFailed(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    const sentAmount = this.parseAmount(wh.data.sentAmount as AmountJSON)

    const { gateHubWalletId: sendingWallet } =
      await this.getGateHubWalletAddress(walletAddress)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'FAILED', value: 0n }
    )

    if (!sentAmount.value) {
      return
    }

    await this.gateHubClient.createTransaction({
      amount: this.amountToNumber(sentAmount),
      vault_uuid: this.getVaultUuid(sentAmount.assetCode),
      sending_address: sendingWallet,
      receiving_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: HOSTED_TRANSACTION_TYPE,
      message: 'Transfer'
    })

    await this.rafikiClient.withdrawLiqudity(wh.id)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: sentAmount.value }
    )
  }

  private async handleIncomingPaymentExpired(wh: WebHook) {
    return this.handleIncomingPaymentCompleted(wh)
  }

  private validateAmount(amount: Amount, eventType: EventType): boolean {
    if (amount.value > 0n) {
      return true
    }
    this.logger.warn(
      `${eventType} received with zero or negative value. Skipping interaction`
    )

    return false
  }

  async getWalletAddress(wh: WebHook) {
    const id: string = wh.data?.walletAddressId || wh.data?.walletAddressId
    return await this.walletAddressService.findByIdWithoutValidation(id)
  }

  private getVaultUuid(assetCode: string): string {
    switch (assetCode) {
      case 'USD':
        return this.env.GATEHUB_VAULT_UUID_USD
      case 'EUR':
        return this.env.GATEHUB_VAULT_UUID_EUR
      default:
        throw new BadRequest(`Unsupported asset code ${assetCode}`)
    }
  }

  private async getGateHubWalletAddress(walletAddress: WalletAddress) {
    const account = await Account.query()
      .findById(walletAddress.accountId)
      .withGraphFetched('user')

    if (!account?.gateHubWalletId || !account.user?.gateHubUserId) {
      throw new BadRequest(
        'No account associated to the provided payment pointer'
      )
    }

    return {
      userId: account.userId,
      gateHubWalletId: account.gateHubWalletId,
      gateHubUserId: account.user.gateHubUserId
    }
  }
}
