import logger from '../../../utils/logger'
import { BadRequestException } from '../../../shared/models/errors/BadRequestException'

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
      case EventType.OutgoingPaymentFailed:
        await this.handleOutgoingPaymentCompletedFailed(wh)
        break
      case EventType.IncomingPaymentCompleted:
      case EventType.IncomingPaymentExpired:
        await this.handleIncomingPaymentCompletedExpired(wh)
        break
      default:
        throw new BadRequestException(`unknown event type, ${wh.type}`)
    }
  }

  //   private parseAmount(amount: AmountJSON): Amount {
  //     return {
  //       value: BigInt(amount['value']),
  //       assetCode: amount['assetCode'],
  //       assetScale: amount['assetScale']
  //     }
  //   }

  private handleOutgoingPaymentCreated(wh: WebHook) {
    //* TODO: handleOutgoingPaymentCreated
    log.info(wh)

    // const payment: any = wh.data['payment']
    // const pp = payment['paymentPointerId'] as string

    //   const acc = await mockAccounts.getByPaymentPointer(pp)

    // const amt = this.parseAmount(payment['sendAmount'])

    //   await mockAccounts.pendingDebit(acc.id, amt.value)

    // notify rafiki

    return
  }

  async handleOutgoingPaymentCompletedFailed(wh: WebHook) {
    //* TODO: handleOutgoingPaymentCompletedFailed
    log.info(wh)

    // const payment = wh.data['payment']
    // const pp = payment['paymentPointerId'] as string
    // const acc = await mockAccounts.getByPaymentPointer(pp)

    // const amtSend = parseAmount(payment['sendAmount'])
    // const amtSent = parseAmount(payment['sentAmount'])

    // const toVoid = amtSend.value - amtSent.value

    // await mockAccounts.debit(acc.id, amtSent.value, true)
    // if (toVoid > 0) {
    //   await mockAccounts.voidPendingDebit(acc.id, toVoid)
    // }

    // TODO: withdraw remaining liquidity

    return
  }

  handleIncomingPaymentCompletedExpired(wh: WebHook) {
    //* TODO: handleIncomingPaymentCompletedExpired
    log.info(wh)

    // const payment = wh.data['incomingPayment']
    // const pp = payment['paymentPointerId'] as string
    // const acc = await mockAccounts.getByPaymentPointer(pp)

    // const amt = parseAmount(payment['receivedAmount'])

    // await mockAccounts.credit(acc.id, amt.value, false)

    return
  }
}
