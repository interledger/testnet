import { BadRequestException } from '../../../shared/models/errors/BadRequestException'

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

export type Amount = {
  value: bigint
  assetCode: string
  assetScale: number
}

export class QuoteService {
  createQuote(receivedQuote: Quote) {
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
        ) +
        BigInt(
          feeStructure.fixed *
            Math.pow(10, receivedQuote.receiveAmount.assetScale)
        )

      if (receiveAmountValue <= fees) {
        throw new BadRequestException('Fees exceed quote receiveAmount')
      }

      receivedQuote.receiveAmount.value = receiveAmountValue - fees
    } else {
      throw new BadRequestException('Invalid paymentType')
    }

    return receivedQuote
  }
}
