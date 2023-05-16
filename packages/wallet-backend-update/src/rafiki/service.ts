/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from 'winston'
import { BadRequestException } from '../../../wallet-backend/src/shared/models/errors/BadRequestException'
import { Env } from '../config/env'
import { RapydClient } from '../rapyd/rapyd-client'
import { RafikiClient } from './rafiki-client'

export enum EventType {
  IncomingPaymentCompleted = 'incoming_payment.completed',
  IncomingPaymentExpired = 'incoming_payment.expired',
  OutgoingPaymentCreated = 'outgoing_payment.created',
  OutgoingPaymentCompleted = 'outgoing_payment.completed',
  OutgoingPaymentFailed = 'outgoing_payment.failed'
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

enum PaymentType {
  FixedSend = 'FixedSend',
  FixedDelivery = 'FixedDelivery'
}

export type Quote = {
  id: string
  paymentType: PaymentType
  paymentPointerId: string
  receiver: string
  sendAmount: Amount
  receiveAmount: Amount
  maxPacketAmount: bigint
  minExchangeRate: number
  lowEstimatedExchangeRate: number
  highEstimatedExchangeRate: number
  createdAt: string
  expiresAt: string
}

export interface Fees {
  fixed: number
  percentage: number
  asset: string
  scale: number
}

interface IRafikiService {
  createQuote: (receivedQuote: Quote) => Promise<Quote>
}

interface RafikiServiceDependencies {
  rapydClient: RapydClient
  env: Env
  logger: Logger
  rafikiClient: RafikiClient
}

export class RafikiService implements IRafikiService {
  constructor(private deps: RafikiServiceDependencies) {}

  async onWebHook(wh: WebHook): Promise<void> {
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
      case EventType.IncomingPaymentExpired:
        await this.handleIncomingPaymentExpired(wh)
        break
      default:
        throw new BadRequestException(`unknown event type, ${wh.type}`)
    }
  }

  private async getRapydWalletIdFromWebHook(wh: WebHook): Promise<string> {
    let ppId = ''
    if (
      [
        EventType.IncomingPaymentCompleted,
        EventType.IncomingPaymentExpired
      ].includes(wh.type)
    ) {
      ppId = wh.data.incomingPayment.paymentPointerId as string
    }
    if (
      [
        EventType.OutgoingPaymentCreated,
        EventType.OutgoingPaymentCompleted
      ].includes(wh.type)
    ) {
      ppId = wh.data.payment.paymentPointerId as string
    }

    //! TODO: uncomment after PaymentPointer is integrated

    // const pp = await PaymentPointerModel.query()
    //   .findById(ppId)
    //   .withGraphFetched('account.user')
    // if (!pp) {
    //   throw new BadRequestException('Invalid payment pointer')
    // }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pp: any = {}

    const user = pp.account.user
    if (!user || !user.rapydEWalletId) {
      throw new BadRequestException(
        'No user associated to the provided payment pointer'
      )
    }

    return user.rapydEWalletId
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
      amount = this.parseAmount(wh.data.payment.sendAmount as AmountJSON)
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
      throw new BadRequestException('Unable to extract amount from webhook')
    }

    return amount
  }

  private amountToNumber(amount: Amount): number {
    return +(Number(amount.value) * 10 ** -amount.assetScale).toFixed(
      amount.assetScale
    )
  }

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    const receiverWalletId = await this.getRapydWalletIdFromWebHook(wh)

    const amount = this.getAmountFromWebHook(wh)

    //! Todo: Uncomment when transactions are integrated
    // if (!this.validateAmount(amount, wh.type)) {
    //   if (wh.type === EventType.IncomingPaymentExpired) {
    //     await updateTransaction(
    //       { paymentId: wh.data.incomingPayment.id },
    //       { status: 'EXPIRED' }
    //     )
    //   }
    //   return
    // }

    const transferResult = await this.deps.rapydClient.transferLiquidity({
      amount: this.amountToNumber(amount),
      currency: amount.assetCode,
      destination_ewallet: receiverWalletId,
      source_ewallet: this.deps.env.RAPYD_SETTLEMENT_EWALLET
    })

    if ((transferResult as any).status?.status !== 'SUCCESS') {
      ;(transferResult as any).status?.message &&
        this.deps.logger.error((transferResult as any).status.message)
      throw new Error(
        `Unable to transfer from ${this.deps.env.RAPYD_SETTLEMENT_EWALLET} into ${receiverWalletId}`
      )
    }

    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    //! Todo: Uncomment when transactions are integrated
    // await updateTransaction(
    //   { paymentId: wh.data.incomingPayment.id },
    //   { status: 'COMPLETED', value: amount.value }
    // )

    this.deps.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        amount
      )} from settlement account ${
        this.deps.env.RAPYD_SETTLEMENT_EWALLET
      } into ${receiverWalletId} `
    )
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    const rapydWalletId = await this.getRapydWalletIdFromWebHook(wh)
    const amount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    const holdResult = await this.deps.rapydClient.holdLiquidity({
      amount: this.amountToNumber(amount),
      currency: amount.assetCode,
      ewallet: rapydWalletId
    })

    if (holdResult.status?.status !== 'SUCCESS') {
      holdResult.status?.message &&
        this.deps.logger.error(holdResult.status.message)
      throw new Error(
        `Unable to hold liquidity on wallet: ${rapydWalletId} on ${EventType.OutgoingPaymentCreated}`
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
    const source_ewallet = await this.getRapydWalletIdFromWebHook(wh)
    const sendAmount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(sendAmount, wh.type)) {
      return
    }

    const releaseResult = await this.deps.rapydClient.releaseLiquidity({
      amount: this.amountToNumber(sendAmount),
      currency: sendAmount.assetCode,
      ewallet: source_ewallet
    })

    if (releaseResult.status?.status !== 'SUCCESS') {
      releaseResult.status?.message &&
        this.deps.logger.error(releaseResult.status.message)
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          sendAmount
        )} from ${source_ewallet}`
      )
    }

    const transferResult = await this.deps.rapydClient.transferLiquidity({
      amount: this.amountToNumber(sendAmount),
      currency: sendAmount.assetCode,
      destination_ewallet: this.deps.env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    if ((transferResult as any).status?.status !== 'SUCCESS') {
      ;(transferResult as any).status?.message &&
        this.deps.logger.error((transferResult as any).status.message)
      throw new Error(
        `Unable to transfer from ${source_ewallet} into settlement account ${this.deps.env.RAPYD_SETTLEMENT_EWALLET} on ${EventType.OutgoingPaymentCompleted}`
      )
    }
    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    //! Todo: Uncomment when transactions are integrated
    // await updateTransaction(
    //   { paymentId: wh.data.payment.id },
    //   { status: 'COMPLETED', value: sendAmount.value }
    // )

    this.deps.logger.info(
      `Succesfully transfered ${this.amountToNumber(
        sendAmount
      )} from ${source_ewallet} to settlement account on ${
        EventType.OutgoingPaymentCompleted
      }`
    )
  }

  private async handleOutgoingPaymentFailed(wh: WebHook) {
    const source_ewallet = await this.getRapydWalletIdFromWebHook(wh)

    const sendAmount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(sendAmount, wh.type)) {
      return
    }

    const releaseResult = await this.deps.rapydClient.releaseLiquidity({
      amount: this.amountToNumber(sendAmount),
      currency: sendAmount.assetCode,
      ewallet: source_ewallet
    })

    if (releaseResult.status?.status !== 'SUCCESS') {
      releaseResult.status?.message &&
        this.deps.logger.error(releaseResult.status.message)
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          sendAmount
        )} from ${source_ewallet} on ${EventType.OutgoingPaymentFailed}`
      )
    }

    //! TODO: Uncomment when transactions are integrated

    // await updateTransaction(
    //   { paymentId: wh.data.payment.id },
    //   { status: 'FAILED', value: 0n }
    // )

    const sentAmount = this.parseAmount(
      wh.data.payment.sentAmount as AmountJSON
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

    if ((transferResult as any).status?.status !== 'SUCCESS') {
      ;(transferResult as any).status?.message &&
        this.deps.logger.error((transferResult as any).status.message)
      throw new Error(
        `Unable to transfer already sent amount from ${source_ewallet} into settlement account ${this.deps.env.RAPYD_SETTLEMENT_EWALLET} on ${EventType.OutgoingPaymentFailed}`
      )
    }

    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    //! TODO: Uncomment when transactions are integrated
    // await updateTransaction(
    //   { paymentId: wh.data.payment.id },
    //   { status: 'COMPLETED', value: sentAmount.value }
    // )
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

  public async createQuote(receivedQuote: Quote) {
    const feeStructure: Fees = {
      fixed: 100,
      percentage: 0.02,
      asset: 'USD',
      scale: 2
    }

    if (receivedQuote.paymentType == PaymentType.FixedDelivery) {
      if (
        receivedQuote.sendAmount.assetCode !== feeStructure.asset ||
        receivedQuote.sendAmount.assetScale !== feeStructure.scale
      ) {
        throw new BadRequestException('Invalid quote sendAmount asset')
      }
      const sendAmountValue = BigInt(receivedQuote.sendAmount.value)
      const fees =
        // TODO: bigint/float multiplication
        BigInt(Math.floor(Number(sendAmountValue) * feeStructure.percentage)) +
        BigInt(feeStructure.fixed)

      receivedQuote.sendAmount.value = sendAmountValue + fees
    } else if (receivedQuote.paymentType === PaymentType.FixedSend) {
      if (receivedQuote.receiveAmount.assetCode !== feeStructure.asset) {
        throw new BadRequestException('Invalid quote receiveAmount asset')
      }
      const receiveAmountValue = BigInt(receivedQuote.receiveAmount.value)
      const fees =
        BigInt(
          Math.floor(Number(receiveAmountValue) * feeStructure.percentage)
        ) + BigInt(feeStructure.fixed)

      if (receiveAmountValue <= fees) {
        throw new BadRequestException('Fees exceed quote receiveAmount')
      }

      receivedQuote.receiveAmount.value = receiveAmountValue - fees
    } else {
      throw new BadRequestException('Invalid paymentType')
    }

    return receivedQuote
  }

  public getRates() {
    return {
      base: 'USD',
      rates: {
        EUR: 1.1602,
        ZAR: 17.3782
      }
    }
  }
}

/*

try {
   

*/
