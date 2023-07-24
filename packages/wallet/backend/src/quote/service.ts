import { AccountService } from '@/account/service'
import { BadRequest, NotFound } from '@/errors'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { PaymentPointer } from '@/paymentPointer/model'
import { Asset, Quote } from '@/rafiki/backend/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { incomingPaymentRegexp } from '@/utils/helpers'
import { RafikiService } from '../rafiki/service'
import { EnrichedQuote } from './controller'
import { PaymentPointerService } from '../paymentPointer/service'

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<Quote>
}

interface QuoteServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
  rafikiService: RafikiService,
  paymentPointerService: PaymentPointerService,
}

type CreateQuoteParams = {
  userId: string
  paymentPointerId: string
  amount: number
  isReceive: boolean
  receiver: string
  description?: string
}

export class QuoteService implements IQuoteService {
  constructor(private deps: QuoteServiceDependencies) {}

  async create(params: CreateQuoteParams): Promise<EnrichedQuote> {
    const existingPaymentPointer = await PaymentPointer.query().findById(
      params.paymentPointerId
    )

    if (!existingPaymentPointer || !existingPaymentPointer.active) {
      throw new BadRequest('Invalid payment pointer')
    }

    const { assetId, assetCode } =
      await this.deps.accountService.findAccountById(
        existingPaymentPointer.accountId,
        params.userId
      )
    const balance = await this.deps.accountService.getAccountBalance(
      params.userId,
      assetCode
    )

    if (Number(balance) < params.amount) {
      throw new BadRequest('Not enough funds in account')
    }

    let asset: Asset | undefined = await this.deps.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    const originalValue = BigInt((params.amount * 10 ** asset.scale).toFixed())
    let value = originalValue

    let paymentUrl = params.receiver

    const pp = await this.deps.paymentPointerService.getExternalPaymentPointer(paymentUrl);

    if(params.isReceive && pp.assetCode !== asset.code){
      const {value: convertedValue} = this.convert(pp.assetCode, asset.code, value);
      value =  convertedValue

      //* This next check is for first-party transfers. Future Third party transfers will need to go through another flow.
      const assetList = await this.deps.rafikiClient.listAssets();
      asset = assetList.find(a=> a.code === pp.assetCode);
      if(!asset){
        throw new BadRequest('Destination payment pointer asset is not supported');
      }
    }


    if (!incomingPaymentRegexp.test(params.receiver)) {
      paymentUrl = await this.deps.incomingPaymentService.createReceiver({
        amount: params.isReceive ? value : null,
        asset,
        paymentPointerUrl: params.receiver,
        description: params.description,
        expiresAt: new Date(Date.now() + 1000 * 60).toISOString()
      })
    }

    return this.enrichQuote(await this.deps.rafikiClient.createQuote({
      paymentPointerId: params.paymentPointerId,
      receiver: paymentUrl,
      asset,
      amount: params.isReceive ? undefined : value
    }), params.isReceive ? originalValue : undefined)
  }

  enrichQuote(quote:Quote, originalValue?: bigint):  EnrichedQuote | Quote{
    if(quote.receiveAmount.assetCode === quote.sendAmount.assetCode){
      return quote
    }
    const {conversionRate, value } = this.convert(quote.sendAmount.assetCode, quote.receiveAmount.assetCode,quote.receiveAmount.value)
    const feeInSenderCurrency = BigInt(quote.sendAmount.value) - value;

    return {
      ...quote,
      fee: {value: originalValue? BigInt(quote.sendAmount.value) - originalValue: feeInSenderCurrency, assetScale: quote.sendAmount.assetScale, assetCode: quote.sendAmount.assetCode, conversionRate}
      
    }

  }

  private convert(sourceAssetCode: string,destinationAssetCode: string, amount: bigint ): {conversionRate: number, value: bigint}{
    const conversionRate = this.deps.rafikiService.getRates(sourceAssetCode).rates[destinationAssetCode];

    const value = BigInt((Number(amount) * conversionRate).toFixed());

    return {conversionRate, value}
  }



}
