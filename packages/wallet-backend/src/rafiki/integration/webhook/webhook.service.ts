import { BadRequestException } from '../../../shared/models/errors/BadRequestException'

import env from '../../../config/env'
import { PaymentPointerModel } from '../../../payment-pointer/payment-pointer.model'
import {
  rapydHoldLiquidity,
  rapydReleaseLiquidity,
  rapydTransferLiquidity
} from '../../../rapyd/wallet'
import logger from '../../../utils/logger'
import {
  depositLiquidity,
  withdrawLiqudity
} from '../../request/liquidity.request'
import { updateTransaction } from '../../../transaction/transaction.service'

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

const log = logger('WebHookService')

export class WebHookService {
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

    const pp = await PaymentPointerModel.query()
      .findById(ppId)
      .withGraphFetched('account.user')
    if (!pp) {
      throw new BadRequestException('Invalid payment pointer')
    }

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

    if (!this.validateAmount(amount, wh.type)) {
      if (wh.type === EventType.IncomingPaymentExpired) {
        await updateTransaction(
          { paymentId: wh.data.incomingPayment.id },
          { status: 'EXPIRED' }
        )
      }
      return
    }

    const transferResult = await rapydTransferLiquidity({
      amount: this.amountToNumber(amount),
      currency: amount.assetCode,
      destination_ewallet: receiverWalletId,
      source_ewallet: env.RAPYD_SETTLEMENT_EWALLET
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      transferResult.status?.message && log.error(transferResult.status.message)
      throw new Error(
        `Unable to transfer from ${env.RAPYD_SETTLEMENT_EWALLET} into ${receiverWalletId}`
      )
    }

    await withdrawLiqudity(wh.id)

    await updateTransaction(
      { paymentId: wh.data.incomingPayment.id },
      { status: 'COMPLETED', value: amount.value }
    )

    log.info(
      `Succesfully transfered ${this.amountToNumber(
        amount
      )} from settlement account ${
        env.RAPYD_SETTLEMENT_EWALLET
      } into ${receiverWalletId} `
    )
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    const rapydWalletId = await this.getRapydWalletIdFromWebHook(wh)
    const amount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(amount, wh.type)) {
      return
    }

    const holdResult = await rapydHoldLiquidity({
      amount: this.amountToNumber(amount),
      currency: amount.assetCode,
      ewallet: rapydWalletId
    })

    if (holdResult.status?.status !== 'SUCCESS') {
      holdResult.status?.message && log.error(holdResult.status.message)
      throw new Error(
        `Unable to hold liquidity on wallet: ${rapydWalletId} on ${EventType.OutgoingPaymentCreated}`
      )
    }
    await depositLiquidity(wh.id)

    log.info(
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

    const releaseResult = await rapydReleaseLiquidity({
      amount: this.amountToNumber(sendAmount),
      currency: sendAmount.assetCode,
      ewallet: source_ewallet
    })

    if (releaseResult.status?.status !== 'SUCCESS') {
      releaseResult.status?.message && log.error(releaseResult.status.message)
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          sendAmount
        )} from ${source_ewallet}`
      )
    }

    const transferResult = await rapydTransferLiquidity({
      amount: this.amountToNumber(sendAmount),
      currency: sendAmount.assetCode,
      destination_ewallet: env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      transferResult.status?.message && log.error(transferResult.status.message)
      throw new Error(
        `Unable to transfer from ${source_ewallet} into settlement account ${env.RAPYD_SETTLEMENT_EWALLET} on ${EventType.OutgoingPaymentCompleted}`
      )
    }
    await withdrawLiqudity(wh.id)

    await updateTransaction(
      { paymentId: wh.data.payment.id },
      { status: 'COMPLETED', value: sendAmount.value }
    )

    log.info(
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

    const releaseResult = await rapydReleaseLiquidity({
      amount: this.amountToNumber(sendAmount),
      currency: sendAmount.assetCode,
      ewallet: source_ewallet
    })

    if (releaseResult.status?.status !== 'SUCCESS') {
      releaseResult.status?.message && log.error(releaseResult.status.message)
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          sendAmount
        )} from ${source_ewallet} on ${EventType.OutgoingPaymentFailed}`
      )
    }

    await updateTransaction(
      { paymentId: wh.data.payment.id },
      { status: 'FAILED', value: 0n }
    )

    const sentAmount = this.parseAmount(
      wh.data.payment.sentAmount as AmountJSON
    )
    if (!sentAmount.value) {
      return
    }

    //* transfer eventual already sent money to the settlement account
    const transferResult = await rapydTransferLiquidity({
      amount: this.amountToNumber(sentAmount),
      currency: sentAmount.assetCode,
      destination_ewallet: env.RAPYD_SETTLEMENT_EWALLET,
      source_ewallet
    })

    if (transferResult.status?.status !== 'SUCCESS') {
      transferResult.status?.message && log.error(transferResult.status.message)
      throw new Error(
        `Unable to transfer already sent amount from ${source_ewallet} into settlement account ${env.RAPYD_SETTLEMENT_EWALLET} on ${EventType.OutgoingPaymentFailed}`
      )
    }

    await withdrawLiqudity(wh.id)

    await updateTransaction(
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
    log.warn(
      `${eventType} received with zero or negative value. Skipping Rapyd interaction`
    )

    return false
  }
}
