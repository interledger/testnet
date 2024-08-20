import { Env } from '@/config/env'
import { WalletAddress } from '@/walletAddress/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { TransactionService } from '@/transaction/service'
import { Logger } from 'winston'
import { RafikiClient } from './rafiki-client'
import { UserService } from '@/user/service'
import { SocketService } from '@/socket/service'
import { NodeCacheInstance } from '@/utils/helpers'
import { WalletAddressService } from '@/walletAddress/service'
import { Account } from '@/account/model'
import MessageType from '@/socket/messageType'
import { BadRequest } from '@shared/backend'

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

interface IRafikiService {
  onWebHook: (wh: WebHook) => Promise<void>
}

export class RafikiService implements IRafikiService {
  constructor(
    private userService: UserService,
    private socketService: SocketService,
    private rapydClient: RapydClient,
    private env: Env,
    private logger: Logger,
    private rafikiClient: RafikiClient,
    private transactionService: TransactionService,
    private walletAddressService: WalletAddressService
  ) {}

  public async onWebHook(wh: WebHook): Promise<void> {
    this.logger.info(
      `received webhook of type : ${wh.type} for : ${
        wh.type === EventType.WalletAddressNotFound ? '' : `${wh.data.id}}`
      }`
    )
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
      default:
        throw new BadRequest(`unknown event type, ${wh.type}`)
    }
  }

  private async getRapydWalletId(
    walletAddress: WalletAddress
  ): Promise<string> {
    const account = await Account.query()
      .findById(walletAddress.accountId)
      .withGraphFetched('user')

    const user = account?.user
    if (!user || !user.rapydWalletId) {
      throw new BadRequest('No user associated to the provided payment pointer')
    }

    return user.rapydWalletId
  }

  private parseAmount(amount: AmountJSON): Amount {
    return { ...amount, value: BigInt(amount.value) }
  }

  private getAmountFromWebHook(wh: WebHook): Amount {
    let amount
    if (
      [
        EventType.OutgoingPaymentCreated,
        EventType.OutgoingPaymentCompleted
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
    const factor = 10 ** toAssetScale;
    const scaledValue = Number(amount.value) * 10 ** -amount.assetScale;
    const truncatedValue = Math.floor(scaledValue * factor) / factor;
    return truncatedValue;
  }

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const amount = this.getAmountFromWebHook(wh)

    const receiverWalletId = await this.getRapydWalletId(walletAddress)

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

    const transferResult = await this.rapydClient.transferLiquidity({
      amount: this.amountToNumber(amount, 2),
      currency: amount.assetCode,
      destination_ewallet: receiverWalletId,
      source_ewallet: this.env.RAPYD_SETTLEMENT_EWALLET
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to transfer from ${
          this.env.RAPYD_SETTLEMENT_EWALLET
        } into ${receiverWalletId} error message: ${
          transferResult.status?.message || 'unknown'
        }`
      )
    }

    await this.rafikiClient.withdrawLiqudity(wh.id)

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: amount.value }
    )

    const user = await this.userService.getByWalletId(receiverWalletId)
    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (user && !isExchange)
      await this.socketService.emitMoneyReceivedByUserId(
        user.id.toString(),
        amount
      )

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        amount,
        2
      )} from settlement account ${
        this.env.RAPYD_SETTLEMENT_EWALLET
      } into ${receiverWalletId} `
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

    const rapydWalletId = await this.getRapydWalletId(walletAddress)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    await this.transactionService.createOutgoingTransaction(
      wh.data,
      walletAddress
    )
    const holdResult = await this.rapydClient.holdLiquidity({
      amount: this.amountToNumber(amount, 2),
      currency: amount.assetCode,
      ewallet: rapydWalletId
    })

    if (holdResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to hold liquidity on wallet: ${rapydWalletId} on ${
          EventType.OutgoingPaymentCreated
        } error message: ${holdResult.status?.message || 'unknown'}`
      )
    }
    await this.rafikiClient.depositLiquidity(wh.id)

    this.logger.info(
      `Succesfully held ${this.amountToNumber(
        amount,
        2
      )} in ${rapydWalletId}  on ${EventType.OutgoingPaymentCreated}`
    )
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
    const walletAddress = await this.getWalletAddress(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    const source_ewallet = await this.getRapydWalletId(walletAddress)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    await this.rapydClient.releaseLiquidity({
      amount: this.amountToNumber(debitAmount, 2),
      currency: debitAmount.assetCode,
      ewallet: source_ewallet
    })

    await this.rapydClient.transferLiquidity({
      amount: this.amountToNumber(debitAmount, 2),
      currency: debitAmount.assetCode,
      destination_ewallet: this.env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    if (wh.data.balance !== '0') {
      await this.rafikiClient.withdrawLiqudity(wh.id)
    }

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'COMPLETED', value: debitAmount.value }
    )

    const user = await this.userService.getByWalletId(source_ewallet)
    const isExchange = NodeCacheInstance.get(wh.data.id)
    if (user && !isExchange) {
      const messageType =
        wh.data.metadata.type === 'instant'
          ? MessageType.MONEY_SENT_SHOP
          : MessageType.MONEY_SENT
      await this.socketService.emitMoneySentByUserId(
        user.id.toString(),
        debitAmount,
        messageType
      )
    }

    this.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        debitAmount,
        2
      )} from ${source_ewallet} to settlement account on ${
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

    const source_ewallet = await this.getRapydWalletId(walletAddress)

    const releaseResult = await this.rapydClient.releaseLiquidity({
      amount: this.amountToNumber(debitAmount, 2),
      currency: debitAmount.assetCode,
      ewallet: source_ewallet
    })

    if (releaseResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          debitAmount,
          2
        )} from ${source_ewallet} on ${
          EventType.OutgoingPaymentFailed
        }  error message:  ${releaseResult.status?.message || 'unknown'}`
      )
    }

    await this.transactionService.updateTransaction(
      { paymentId: wh.data.id },
      { status: 'FAILED', value: 0n }
    )

    if (!sentAmount.value) {
      return
    }

    //* transfer eventual already sent money to the settlement account
    const transferResult = await this.rapydClient.transferLiquidity({
      amount: this.amountToNumber(sentAmount, 2),
      currency: sentAmount.assetCode,
      destination_ewallet: this.env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to transfer already sent amount from ${source_ewallet} into settlement account ${
          this.env.RAPYD_SETTLEMENT_EWALLET
        } on ${EventType.OutgoingPaymentFailed} error message: ${
          transferResult.status?.message || 'unknown'
        }`
      )
    }

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
      `${eventType} received with zero or negative value. Skipping Rapyd interaction`
    )

    return false
  }

  async getWalletAddress(wh: WebHook) {
    const id: string = wh.data?.walletAddressId || wh.data?.walletAddressId
    return await this.walletAddressService.findByIdWithoutValidation(id)
  }
}
