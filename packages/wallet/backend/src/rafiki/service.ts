import { Env } from '@/config/env'
import { BadRequest } from '@/errors'
import { PaymentPointer } from '@/paymentPointer/model'
import { RapydClient } from '@/rapyd/rapyd-client'
import { TransactionService } from '@/transaction/service'
import { Logger } from 'winston'
import { RatesService } from '../rates/service'
import { RafikiClient } from './rafiki-client'

export enum EventType {
  IncomingPaymentCreated = 'incoming_payment.created',
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

export enum PaymentType {
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
  createQuote: (receivedQuote: Quote) => Promise<Quote>
  onWebHook: (wh: WebHook) => Promise<void>
}

interface RafikiServiceDependencies {
  rapydClient: RapydClient
  ratesService: RatesService
  env: Env
  logger: Logger
  rafikiClient: RafikiClient
  transactionService: TransactionService
}

export class RafikiService implements IRafikiService {
  constructor(private deps: RafikiServiceDependencies) {}

  public async onWebHook(wh: WebHook): Promise<void> {
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
        return
      case EventType.IncomingPaymentExpired:
        await this.handleIncomingPaymentExpired(wh)
        break
      default:
        throw new BadRequest(`unknown event type, ${wh.type}`)
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

    const pp = await PaymentPointer.query()
      .findById(ppId)
      .withGraphFetched('account.user')
    if (!pp) {
      throw new BadRequest('Invalid payment pointer')
    }

    const user = pp.account.user
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
    const receiverWalletId = await this.getRapydWalletIdFromWebHook(wh)

    const amount = this.getAmountFromWebHook(wh)

    if (!this.validateAmount(amount, wh.type)) {
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

    if (transferResult.status?.status !== 'SUCCESS') {
      throw new Error(
        `Unable to transfer from ${source_ewallet} into settlement account ${
          this.deps.env.RAPYD_SETTLEMENT_EWALLET
        } on ${EventType.OutgoingPaymentCompleted} error message: ${
          transferResult.status.message || 'unknown'
        }`
      )
    }
    await this.deps.rafikiClient.withdrawLiqudity(wh.id)

    await this.deps.transactionService.updateTransaction(
      { paymentId: wh.data.payment.id },
      { status: 'COMPLETED', value: sendAmount.value }
    )

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
      throw new Error(
        `Unable to release amount ${this.amountToNumber(
          sendAmount
        )} from ${source_ewallet} on ${
          EventType.OutgoingPaymentFailed
        }  error message:  ${releaseResult.status?.message || 'unknown'}`
      )
    }

    await this.deps.transactionService.updateTransaction(
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

  public async createQuote(receivedQuote: Quote) {
    const feeStructure: Fees = {
      USD: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      EUR: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      AED: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      AUD: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      CAD: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      CHF: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      CZK: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      DKK: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      GHP: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      HKD: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      HRK: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      HUF: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      IDR: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      ILS: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      JPY: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      MXN: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      NOK: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      NZD: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      PLN: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      RON: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      SEK: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      SGD: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      TRY: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      },
      ZAR: {
        fixed: 100,
        percentage: 0.02,
        scale: 2
      }
    }

    if (
      receivedQuote.sendAmount.assetCode !==
      receivedQuote.receiveAmount.assetCode
    ) {
      this.deps.logger.debug(
        `conversion fee (from rafiki) : ${
          receivedQuote.sendAmount.value - receivedQuote.receiveAmount.value
        }`
      )
      this.deps.logger.debug(
        `Send amount value: ${receivedQuote.sendAmount.value}`
      )
      this.deps.logger.debug(
        `Receive amount: ${receivedQuote.receiveAmount.value} from rafiki which includes cross currency fees already.`
      )
    }

    const actualFee = feeStructure[receivedQuote.sendAmount.assetCode]

    if (receivedQuote.paymentType == PaymentType.FixedDelivery) {
      if (
        feeStructure[receivedQuote.sendAmount.assetCode] &&
        receivedQuote.sendAmount.assetScale !==
          feeStructure[receivedQuote.sendAmount.assetCode].scale
      ) {
        throw new BadRequest('Invalid quote sendAmount asset')
      }
      const sendAmountValue = BigInt(receivedQuote.sendAmount.value)

      const fees =
        // TODO: bigint/float multiplication
        BigInt(Math.floor(Number(sendAmountValue) * actualFee.percentage)) +
        BigInt(actualFee.fixed)

      this.deps.logger.debug(
        `wallet fees: (sendAmount (${Math.floor(
          Number(sendAmountValue)
        )}) * wallet percentage (${actualFee.percentage})) + fixed ${
          actualFee.fixed
        } = ${fees}`
      )

      receivedQuote.sendAmount.value = sendAmountValue + fees

      this.deps.logger.debug(
        `Will finally send: ${receivedQuote.sendAmount.value}`
      )
    } else if (receivedQuote.paymentType === PaymentType.FixedSend) {
      if (
        !Object.keys(feeStructure).includes(
          receivedQuote.receiveAmount.assetCode
        )
      ) {
        throw new BadRequest('Invalid quote receiveAmount asset')
      }

      const receiveAmountValue = BigInt(receivedQuote.receiveAmount.value)

      const fees =
        BigInt(Math.floor(Number(receiveAmountValue) * actualFee.percentage)) +
        BigInt(actualFee.fixed)

      this.deps.logger.debug(
        `Wallet fee: ${Math.floor(Number(receiveAmountValue))}  * ${
          actualFee.percentage
        }  + fixed: ${BigInt(actualFee.fixed)}  = ${fees}`
      )

      if (receiveAmountValue <= fees) {
        throw new BadRequest('Fees exceed quote receiveAmount')
      }

      receivedQuote.receiveAmount.value = receiveAmountValue - fees

      this.deps.logger.debug(
        `Sum of fees (conversion fee from rafiki + wallet fee): ${
          receivedQuote.sendAmount.value - receivedQuote.receiveAmount.value
        } + ${fees} ${receiveAmountValue - fees}`
      )

      this.deps.logger.debug(
        `Will finally receive ${receivedQuote.receiveAmount.value}`
      )
    } else {
      throw new BadRequest('Invalid paymentType')
    }

    return receivedQuote
  }
}
