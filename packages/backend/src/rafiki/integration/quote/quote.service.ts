import { BadRequestException } from '../../../shared/models/errors/BadRequestException'
export type Amount = {
  value: string // bigint
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
  maxPacketAmount: number // bigint
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

      receivedQuote.sendAmount.value = (sendAmountValue + fees).toString()
    } else {
      throw new BadRequestException('Invalid paymentType')
    }

    //* TODO: React on quote create

    return receivedQuote
  }
}
