import logger from '../../../utils/logger'
import { BadRequestException } from '../../../shared/models/errors/BadRequestException'
import { NotFoundException } from '../../../shared/models/errors/NotFoundException'
import { Account } from '../../../account/account.model'
import { Query } from '../../generated/graphql'
import { User } from '../../../user/models/user'
import { makeRapydPostRequest } from '../../../rapyd/utills/request'

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

  private async getRapydWalletIdFromWebHook(
    wh: WebHook
  ): Promise<string | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payment: any = wh.data['payment']
    const ppId = payment['paymentPointerId'] as string

    const user = await User.query()
      .joinRelated('accounts.paymentPointers')
      .where('paymentPointers.id', ppId)
      .first()

    if (!user) {
      //! maybe just log, no throw
      throw new NotFoundException('Associated user not found!')
    }

    return user.rapydEWalletId
  }

  private getAmountFromWebHook(wh: WebHook) {
    return Number(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (wh.data['payment'] as any)[
        `${
          wh.type === EventType.OutgoingPaymentCompleted
            ? 'sendAmount'
            : 'receiveAmount'
        }`
      ]
    )
  }

  private async handleIncomingPaymentCompleted(wh: WebHook) {
    log.info(wh)

    const rapydWalletId = await this.getRapydWalletIdFromWebHook(wh)
    const amount = this.getAmountFromWebHook(wh)

    const result = await makeRapydPostRequest(
      'account/deposit',
      JSON.stringify({
        amount,
        currency: 'USD',
        ewallet: rapydWalletId
      })
    )

    if (result.status.status !== 'SUCCESS') {
      log.error(
        result.status.message ||
          `Unable to deposit into wallet: ${rapydWalletId}`
      )
    }

    log.info(`Succesfully deposited ${amount} into ${rapydWalletId}`)
  }

  private async handleOutgoingPaymentCompleted(wh: WebHook) {
    log.info(wh)

    const rapydWalletId = await this.getRapydWalletIdFromWebHook(wh)
    const amount = this.getAmountFromWebHook(wh)

    const result = await makeRapydPostRequest(
      'account/withdraw',
      JSON.stringify({
        ewallet: rapydWalletId,
        amount,
        currency: 'USD'
      })
    )

    if (result.status.status !== 'SUCCESS') {
      log.error(
        result.status.message ||
          `Unable to withdraw from wallet: ${rapydWalletId}`
      )
    }

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
