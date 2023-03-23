import { BadRequestException } from '../../../shared/models/errors/BadRequestException'

import {
  rapydDepositLiquidity,
  rapydWithdrawLiquidity
} from '../../../rapyd/wallet'
import logger from '../../../utils/logger'
import { PaymentPointerModel } from '../../../payment-pointer/payment-pointer.model'
import {
  depositLiquidity,
  withdrawLiqudity
} from '../../request/liquidity.request'

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
  data: Record<string, unknown>
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
  async onWebHook(wh: WebHook): Promise<boolean> {
    switch (wh.type) {
      case EventType.OutgoingPaymentCreated:
        return this.handleOutgoingPaymentCreated(wh)
      case EventType.OutgoingPaymentCompleted:
        return this.handleOutgoingPaymentCompleted(wh)
      case EventType.OutgoingPaymentFailed:
        return this.handleOutgoingPaymentCompletedFailed(wh)
      case EventType.IncomingPaymentCompleted:
        return this.handleIncomingPaymentCompleted(wh)
      case EventType.IncomingPaymentExpired:
        return this.handleIncomingPaymentCompletedExpired(wh)
      default:
        throw new BadRequestException(`unknown event type, ${wh.type}`)
    }
  }

  private async getRapydWalletIdFromWebHook(wh: WebHook): Promise<string> {
    const ppId = wh.data.paymentPointerId as string

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
    return {
      value: BigInt(amount['value']),
      assetCode: amount['assetCode'],
      assetScale: amount['assetScale']
    }
  }

  private getAmountFromWebHook(wh: WebHook): Amount {
    let amount
    if (wh.type === EventType.OutgoingPaymentCompleted) {
      const amtSend = this.parseAmount(wh.data.sendAmount as AmountJSON)
      //* maybe store this as transaction data
      // const amtSent = this.parseAmount(payment['sentAmount'])
      // const fee = amtSend.value - amtSent.value
      amount = amtSend
    }

    if (wh.type === EventType.IncomingPaymentCompleted) {
      amount = this.parseAmount(wh.data.receivedAmount as AmountJSON)
    }

    if (!amount) {
      throw new BadRequestException('Unable to extract amount from webhook')
    }

    return amount
  }

  amountToNumber(amount: Amount) {
    return (Number(amount.value) / 100).toFixed(amount.assetScale)
  }

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    //* DOCS:
    /*
An Open Payments Incoming Payment was completed, either manually or programmatically, i.e. 
it does not accept any incoming funds anymore. 
The Account Servicing Entity SHOULD withdraw all funds received and deposit them
into the payee's account.

Action: Withdraw liquidity
    */

    const rapydWalletId = await this.getRapydWalletIdFromWebHook(wh)
    const amount = this.getAmountFromWebHook(wh)

    const result = await rapydDepositLiquidity({
      amount: +this.amountToNumber(amount),
      currency: amount.assetCode,
      ewallet: rapydWalletId
    })

    if (result.status.status !== 'SUCCESS') {
      log.error(
        result.status.message ||
          `Unable to deposit into wallet: ${rapydWalletId}`
      )
      return false
    }

    await withdrawLiqudity(wh.id)

    log.info(`Succesfully deposited ${amount} into ${rapydWalletId}`)
    return true
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
    //* DOCS:
    /*
An Open Payments Outgoing Payment was completed, i.e. it won't send any further funds. 
The Account Servicing Entity SHOULD withdraw any excess liquidity and deposit it 
into the payer's account.

Action: Withdraw liquidity
    */

    log.info(`webhook outgoing payment completed: ${wh.id}`)
    //TODO:withdraw liquidity (related to the fee)
    return true
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    //* DOCS:
    /*
An Open Payments Outgoing Payment has been created. 
It requires liquidity to be processed. 
The Account Servicing Entity SHOULD reserve 
the maximum requisite funds for the payment attempt on the payer's account.

Action: Deposit liquidity
    */
    const rapydWalletId = await this.getRapydWalletIdFromWebHook(wh)
    const amount = this.getAmountFromWebHook(wh)

    const result = await rapydWithdrawLiquidity({
      amount: +this.amountToNumber(amount),
      currency: amount.assetCode,
      ewallet: rapydWalletId
    })

    if (result.status.status !== 'SUCCESS') {
      log.error(
        result.status.message ||
          `Unable to deposit into wallet: ${rapydWalletId}`
      )
      return false
    }
    await depositLiquidity(wh.id)

    return true
  }

  async handleOutgoingPaymentCompletedFailed(wh: WebHook) {
    //* TODO: handleOutgoingPaymentCompletedFailed
    log.info(wh)

    // TODO: withdraw remaining liquidity

    return true
  }

  handleIncomingPaymentCompletedExpired(wh: WebHook) {
    //* TODO: handleIncomingPaymentCompletedExpired
    log.info(wh)

    return true
  }
}
