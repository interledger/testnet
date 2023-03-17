import { knex } from '../../..'
import { BadRequestException } from '../../../shared/models/errors/BadRequestException'

import {
  rapydDepositLiquidity,
  rapydWithdrawLiquidity
} from '../../../rapyd/wallet'
import { InternalServerError } from '../../../shared/models/errors/InternalServerError'
import logger from '../../../utils/logger'
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
  async onWebHook(wh: WebHook) {
    switch (wh.type) {
      case EventType.OutgoingPaymentCreated:
        await this.handleOutgoingPaymentCreated(wh)
        break
      case EventType.OutgoingPaymentCompleted:
        await this.handleOutgoingPaymentCompleted(wh)
        break
      case EventType.OutgoingPaymentFailed:
        await this.handleOutgoingPaymentCompletedFailed(wh)
        break
      case EventType.IncomingPaymentCompleted:
        await this.handleIncomingPaymentCompleted(wh)
        break
      case EventType.IncomingPaymentExpired:
        await this.handleIncomingPaymentCompletedExpired(wh)
        break
      default:
        throw new BadRequestException(`unknown event type, ${wh.type}`)
    }
  }

  private async getRapydWalletIdFromWebHook(wh: WebHook): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ppId = wh.data['paymentPointerId'] as string

    try {
      const query = `select "users"."rapydEWalletId" from "users" inner join "accounts" on "accounts"."userId"::uuid = "users"."id" inner join "paymentPointers" as "accounts:paymentPointers" on "accounts:paymentPointers"."accountId" = "accounts"."id" where "accounts:paymentPointers"."id" = '${ppId}'`
      const response = await knex.raw(query)

      const rapydEWalletId = response?.rows?.[0]?.rapydEWalletId

      if (!rapydEWalletId) {
        throw new BadRequestException('Invalid input')
      }

      return rapydEWalletId
    } catch (e) {
      log.error(e)
      throw new InternalServerError()
    }
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
      return
    }

    await depositLiquidity(wh.id)

    log.info(`Succesfully deposited ${amount} into ${rapydWalletId}`)
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
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
          `Unable to withdraw from wallet: ${rapydWalletId}`
      )
      return
    }

    await withdrawLiqudity(wh.id)
    log.info(`Succesfully withdrew ${amount} from ${rapydWalletId}`)
  }

  private async handleOutgoingPaymentCreated(wh: WebHook) {
    //* TODO: handleOutgoingPaymentCreated
    log.info(wh)

    return
  }

  async handleOutgoingPaymentCompletedFailed(wh: WebHook) {
    //* TODO: handleOutgoingPaymentCompletedFailed
    log.info(wh)

    // TODO: withdraw remaining liquidity

    return
  }

  handleIncomingPaymentCompletedExpired(wh: WebHook) {
    //* TODO: handleIncomingPaymentCompletedExpired
    log.info(wh)

    return
  }
}
