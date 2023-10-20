import { Env } from '@/config/env'
import { BadRequest } from '@/errors'
import { PaymentPointer } from '@/paymentPointer/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { TransactionService } from '@/transaction/service'
import { Logger } from 'winston'
import { RatesService } from '@/rates/service'
import { RafikiClient } from './rafiki-client'
import { UserService } from '@/user/service'
import { SocketService } from '@/socket/service'
import { PaymentPointerService } from '@/paymentPointer/service'
import { WMTransactionService } from '@/webMonetization/transaction/service'
import { Account } from '@/account/model'
import { WMTransaction } from '@/webMonetization/transaction/model'

export enum EventType {
  IncomingPaymentCreated = 'incoming_payment.created',
  IncomingPaymentCompleted = 'incoming_payment.completed',
  IncomingPaymentExpired = 'incoming_payment.expired',
  OutgoingPaymentCreated = 'outgoing_payment.created',
  OutgoingPaymentCompleted = 'outgoing_payment.completed',
  OutgoingPaymentFailed = 'outgoing_payment.failed',
  PaymentPointerNotFound = 'payment_pointer.not_found'
}

export interface WebHook {
  id: string
  type: EventType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
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
  paymentPointerId: string
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

interface RafikiServiceDependencies {
  userService: UserService
  socketService: SocketService
  rapydClient: RapydClient
  ratesService: RatesService
  env: Env
  logger: Logger
  rafikiClient: RafikiClient
  transactionService: TransactionService
  paymentPointerService: PaymentPointerService
  wmTransactionService: WMTransactionService
}

export class RafikiService implements IRafikiService {
  constructor(private deps: RafikiServiceDependencies) {}

  public async onWebHook(wh: WebHook): Promise<void> {
    this.deps.logger.info(
      `received webhook of type : ${wh.type} for : ${
        wh.type === EventType.PaymentPointerNotFound
          ? ''
          : wh.data.incomingPayment
          ? `incomingPayment ${wh.data.incomingPayment.id}}`
          : `outgoingPayment ${wh.data.payment.id}}`
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
      case EventType.PaymentPointerNotFound:
        this.deps.logger.warn(`${EventType.PaymentPointerNotFound} received`)
        break
      default:
        throw new BadRequest(`unknown event type, ${wh.type}`)
    }
  }

  private async getRapydWalletId(
    paymentPointer: PaymentPointer
  ): Promise<string> {
    const account = await Account.query()
      .findById(paymentPointer.accountId)
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
      amount = this.parseAmount(wh.data.payment.debitAmount as AmountJSON)
    }

    if (
      [
        EventType.IncomingPaymentCompleted,
        EventType.IncomingPaymentExpired
      ].includes(wh.type)
    ) {
      amount = this.parseAmount(
        wh.data.incomingPayment.receivedAmount as AmountJSON
      )
    }

    if (!amount) {
      throw new BadRequest('Unable to extract amount from webhook')
    }

    return amount
  }

  private amountToNumber(amount: Amount): number {
    return +(Number(amount.value) * 10 ** -amount.assetScale).toFixed(
      amount.assetScale
    )
  }

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    const paymentPointer = await this.getPaymentPointer(wh)
    const amount = this.getAmountFromWebHook(wh)

    if (paymentPointer.isWM) {
      await this.deps.rafikiClient.withdrawLiqudity(wh.id)

      await this.deps.wmTransactionService.updateTransaction(
        { paymentId: wh.data.incomingPayment.id },
        { status: 'COMPLETED', value: amount.value }
      )

      return
    }

    const receiverWalletId = await this.getRapydWalletId(paymentPointer)

    if (!this.validateAmount(amount, wh.type)) {
      //* Only in case the expired incoming payment has no money received will it be set as expired.
      //* Otherwise, it will complete, even if not all the money is yet sent.
      if (wh.type === EventType.IncomingPaymentExpired) {
        await this.deps.transactionService.updateTransaction(
          { paymentId: wh.data.incomingPayment.id },
          { status: 'EXPIRED' }
        )
      }
      return
    }

    const transferResult = await this.deps.rapydClient.transferLiquidity({
      amount: this.amountToNumber(amount),
      currency: amount.assetCode,
      destination_ewallet: receiverWalletId,
      source_ewallet: this.deps.env.RAPYD_SETTLEMENT_EWALLET
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to transfer from ${
          this.deps.env.RAPYD_SETTLEMENT_EWALLET
        } into ${receiverWalletId} error message: ${
          transferResult.status?.message || 'unknown'
        }`
      )
    }

    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    await this.deps.transactionService.updateTransaction(
      { paymentId: wh.data.incomingPayment.id },
      { status: 'COMPLETED', value: amount.value }
    )

    const user = await this.deps.userService.getByWalletId(receiverWalletId)
    if (user)
      await this.deps.socketService.emitMoneyReceivedByUserId(
        user.id.toString(),
        amount
      )

    this.deps.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        amount
      )} from settlement account ${
        this.deps.env.RAPYD_SETTLEMENT_EWALLET
      } into ${receiverWalletId} `
    )
  }

  private async handleIncomingPaymentCreated(wh: WebHook) {
    const paymentPointer = await this.getPaymentPointer(wh)

    if (paymentPointer.isWM) {
      await this.deps.wmTransactionService.createIncomingTransaction(
        wh.data.incomingPayment
      )

      return
    }

    await this.deps.transactionService.createIncomingTransaction(
      wh.data.incomingPayment,
      paymentPointer
    )
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    const paymentPointer = await this.getPaymentPointer(wh)
    const amount = this.getAmountFromWebHook(wh)

    if (paymentPointer.isWM) {
      await this.deps.rafikiClient.depositLiquidity(wh.id)

      await this.deps.wmTransactionService.createOutgoingTransaction(
        wh.data.payment
      )

      return
    }

    const rapydWalletId = await this.getRapydWalletId(paymentPointer)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    await this.deps.transactionService.createOutgoingTransaction(
      wh.data.payment,
      paymentPointer
    )
    const holdResult = await this.deps.rapydClient.holdLiquidity({
      amount: this.amountToNumber(amount),
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
    await this.deps.rafikiClient.depositLiquidity(wh.id)

    this.deps.logger.info(
      `Succesfully held ${this.amountToNumber(
        amount
      )} in ${rapydWalletId}  on ${EventType.OutgoingPaymentCreated}`
    )
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
    const paymentPointer = await this.getPaymentPointer(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    if (paymentPointer.isWM) {
      await this.deps.rafikiClient.withdrawLiqudity(wh.id)

      await this.deps.wmTransactionService.updateTransaction(
        { paymentId: wh.data.payment.id },
        { status: 'COMPLETED', value: debitAmount.value }
      )

      return
    }

    const source_ewallet = await this.getRapydWalletId(paymentPointer)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    await this.deps.rapydClient.releaseLiquidity({
      amount: this.amountToNumber(debitAmount),
      currency: debitAmount.assetCode,
      ewallet: source_ewallet
    })

    await this.deps.rapydClient.transferLiquidity({
      amount: this.amountToNumber(debitAmount),
      currency: debitAmount.assetCode,
      destination_ewallet: this.deps.env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    await this.deps.transactionService.updateTransaction(
      { paymentId: wh.data.payment.id },
      { status: 'COMPLETED', value: debitAmount.value }
    )

    const user = await this.deps.userService.getByWalletId(source_ewallet)
    if (user)
      await this.deps.socketService.emitMoneySentByUserId(
        user.id.toString(),
        debitAmount
      )

    this.deps.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        debitAmount
      )} from ${source_ewallet} to settlement account on ${
        EventType.OutgoingPaymentCompleted
      }`
    )
  }

  private async handleOutgoingPaymentFailed(wh: WebHook) {
    const paymentPointer = await this.getPaymentPointer(wh)
    const debitAmount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(debitAmount, wh.type)) {
      return
    }

    const sentAmount = this.parseAmount(
      wh.data.payment.sentAmount as AmountJSON
    )

    if (paymentPointer.isWM) {
      await this.deps.rafikiClient.withdrawLiqudity(wh.id)

      const update: Partial<WMTransaction> = sentAmount.value
        ? { status: 'COMPLETED', value: sentAmount.value }
        : { status: 'FAILED', value: 0n }
      await this.deps.wmTransactionService.updateTransaction(
        { paymentId: wh.data.payment.id },
        update
      )

      return
    }

    const source_ewallet = await this.getRapydWalletId(paymentPointer)

    const releaseResult = await this.deps.rapydClient.releaseLiquidity({
      amount: this.amountToNumber(debitAmount),
      currency: debitAmount.assetCode,
      ewallet: source_ewallet
    })

    if (releaseResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          debitAmount
        )} from ${source_ewallet} on ${
          EventType.OutgoingPaymentFailed
        }  error message:  ${releaseResult.status?.message || 'unknown'}`
      )
    }

    await this.deps.transactionService.updateTransaction(
      { paymentId: wh.data.payment.id },
      { status: 'FAILED', value: 0n }
    )

    if (!sentAmount.value) {
      return
    }

    //* transfer eventual already sent money to the settlement account
    const transferResult = await this.deps.rapydClient.transferLiquidity({
      amount: this.amountToNumber(sentAmount),
      currency: sentAmount.assetCode,
      destination_ewallet: this.deps.env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to transfer already sent amount from ${source_ewallet} into settlement account ${
          this.deps.env.RAPYD_SETTLEMENT_EWALLET
        } on ${EventType.OutgoingPaymentFailed} error message: ${
          transferResult.status?.message || 'unknown'
        }`
      )
    }

    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    await this.deps.transactionService.updateTransaction(
      { paymentId: wh.data.payment.id },
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
    this.deps.logger.warn(
      `${eventType} received with zero or negative value. Skipping Rapyd interaction`
    )

    return false
  }

  async getPaymentPointer(wh: WebHook) {
    const ppId: string =
      wh.data.incomingPayment?.paymentPointerId ||
      wh.data.payment?.paymentPointerId
    return await this.deps.paymentPointerService.findByIdWithoutValidation(ppId)
  }
}
