import { AccountService } from '@/account/service'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { WalletAddress } from '@/walletAddress/model'
import { Asset, Quote } from '@/rafiki/backend/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'
import {
  incomingPaymentRegexp,
  transformBalance,
  urlToPaymentId
} from '@/utils/helpers'
import {
  createWalletAddressIfFalsy,
  WalletAddressService
} from '@/walletAddress/service'
import { QuoteWithFees } from './controller'
import { RatesService } from '@/rates/service'
import { Account } from '@/account/model'
import { NodeCacheInstance } from '@/utils/helpers'
import { BadRequest, NotFound } from '@shared/backend'
type CreateExchangeQuote = {
  userId: string
  accountId: string
  assetCode: string
  amount: number
}

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<Quote>
  createExchangeQuote: (args: CreateExchangeQuote) => Promise<QuoteWithFees>
}

type CreateQuoteParams = {
  userId: string
  walletAddressId: string
  amount: number
  isReceive: boolean
  receiver: string
  description?: string
}

type ConvertParams = {
  from: string
  to: string
  amount: bigint
}

const getAccountWithWalletAddressBy = async (where: Partial<Account>) => {
  const account = await Account.query()
    .where(where)
    .withGraphFetched({ walletAddresses: true })
    .modifyGraph('walletAddresses', (builder) => {
      builder.where({ active: true }).orderBy('createdAt', 'ASC').limit(1)
    })
    .limit(1)
    .first()

  return account
}

export class QuoteService implements IQuoteService {
  constructor(
    private accountService: AccountService,
    private rafikiClient: RafikiClient,
    private incomingPaymentService: IncomingPaymentService,
    private ratesService: RatesService,
    private walletAddressService: WalletAddressService
  ) {}

  async create(params: CreateQuoteParams): Promise<QuoteWithFees> {
    const existingWalletAddress = await WalletAddress.query().findById(
      params.walletAddressId
    )

    if (!existingWalletAddress || !existingWalletAddress.active) {
      throw new BadRequest('Invalid payment pointer')
    }

    const { assetId, assetCode } = await this.accountService.findAccountById(
      existingWalletAddress.accountId,
      params.userId
    )

    const account = await this.accountService.getAccountById(
      params.userId,
      existingWalletAddress.accountId
    )
    const balance = account.balance

    if (Number(balance) < params.amount) {
      throw new BadRequest('Not enough funds in account')
    }

    let asset: Pick<Asset, 'scale' | 'code'> | undefined =
      await this.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    const originalValue = BigInt((params.amount * 10 ** asset.scale).toFixed())
    let value = originalValue

    let paymentUrl = params.receiver

    const isIncomingPayment = incomingPaymentRegexp.test(params.receiver)

    let assetDetails
    if (isIncomingPayment) {
      const payment =
        await this.incomingPaymentService.getExternalPayment(paymentUrl)
      assetDetails = {
        assetCode: payment.receivedAmount.assetCode,
        assetScale: payment.receivedAmount.assetScale
      }
    } else {
      const walletAddress =
        await this.walletAddressService.getExternalWalletAddress(paymentUrl)
      assetDetails = {
        assetCode: walletAddress.assetCode,
        assetScale: walletAddress.assetScale
      }
    }

    if (params.isReceive && assetDetails.assetCode !== asset.code) {
      let convertedValue = await this.convert({
        from: assetCode,
        to: assetDetails.assetCode,
        amount: value
      })
      if (isIncomingPayment) {
        const payment =
          await this.incomingPaymentService.getPaymentDetailsByUrl(
            params.receiver
          )

        const amount = payment?.value
          ? transformBalance(payment?.value, assetDetails.assetScale)
          : undefined

        // adjust the amount in case that after converting it to the receiver currency it is off by a small margin
        if (amount && 1 - Number(amount) / Number(convertedValue) < 0.01) {
          convertedValue = amount
        }
      }

      value = convertedValue

      //* This next check is for first-party transfers. Future Third party transfers will need to go through another flow.
      // TODO: discuss if this check is required
      // const assetList = await this.rafikiClient.listAssets({ first: 100 })
      // asset = assetList.find(
      //   (a) => a.code === destinationWalletAddress.assetCode
      // )
      // if (!asset) {
      //   throw new BadRequest(
      //     'Destination wallet address asset is not supported'
      //   )
      // }

      asset = {
        code: assetDetails.assetCode,
        scale: assetDetails.assetScale
      }
    }

    if (!isIncomingPayment) {
      paymentUrl = await this.incomingPaymentService.createReceiver({
        amount: params.isReceive ? value : null,
        asset: {
          code: assetDetails.assetCode,
          scale: assetDetails.assetScale
        },
        walletAddressUrl: params.receiver,
        description: params.description,
        expiresAt: new Date(Date.now() + 1000 * 15)
      })
    }

    const amountParams = {
      assetCode: asset.code,
      assetScale: asset.scale,
      value
    }

    const quote = await this.rafikiClient.createQuote({
      walletAddressId: params.walletAddressId,
      receiveAmount: params.isReceive ? amountParams : undefined,
      receiver: paymentUrl,
      debitAmount: params.isReceive ? undefined : amountParams
    })

    return this.addConversionInfo(
      quote,
      params.isReceive ? originalValue : undefined
    )
  }

  private async addConversionInfo(
    quote: Quote,
    originalValue?: bigint
  ): Promise<QuoteWithFees | Quote> {
    if (quote.receiveAmount.assetCode === quote.debitAmount.assetCode) {
      return quote
    }
    const value = await this.convert({
      from: quote.receiveAmount.assetCode,
      to: quote.debitAmount.assetCode,
      amount: quote.receiveAmount.value
    })

    const feeInSenderCurrency = BigInt(quote.debitAmount.value) - value

    return {
      ...quote,
      fee: {
        value: originalValue
          ? BigInt(quote.debitAmount.value) - originalValue
          : feeInSenderCurrency,
        assetScale: quote.debitAmount.assetScale,
        assetCode: quote.debitAmount.assetCode
      }
    }
  }

  private async convert(params: ConvertParams): Promise<bigint> {
    const conversionRate = await this.ratesService.getRates(params.from)
    return BigInt(
      (Number(params.amount) * conversionRate.rates[params.to]).toFixed()
    )
  }

  public async createExchangeQuote({
    userId,
    accountId,
    assetCode,
    amount
  }: CreateExchangeQuote): Promise<QuoteWithFees> {
    const accountFrom = await getAccountWithWalletAddressBy({
      userId,
      id: accountId
    })

    if (!accountFrom) {
      throw new NotFound(`The source account does not exist for this user.`)
    }

    const rafikiAsset = await this.rafikiClient.getRafikiAsset(assetCode)
    if (!rafikiAsset) {
      throw new NotFound(
        `Asset Code "${assetCode}" does not exist in Rafiki; Payment Pointer could not be automatically created.`
      )
    }

    const senderPp = await createWalletAddressIfFalsy({
      walletAddress: accountFrom.walletAddresses?.[0],
      userId,
      accountId: accountFrom.id,
      publicName: `Exchange Payment Pointer (exchanging into ${assetCode})`,
      walletAddressService: this.walletAddressService
    })
    const senderPpId = senderPp.id

    let accountTo = await getAccountWithWalletAddressBy({ userId, assetCode })

    if (!accountTo) {
      accountTo = await this.accountService.createAccount({
        name: `${assetCode} account`,
        userId,
        assetId: rafikiAsset.id
      })
    }

    const receiverPp = await createWalletAddressIfFalsy({
      walletAddress: accountTo.walletAddresses?.[0],
      userId,
      accountId: accountTo.id,
      publicName: `${assetCode} Payment Pointer`,
      walletAddressService: this.walletAddressService
    })
    const receiverPpUrl = receiverPp.url

    const quote = await this.create({
      userId,
      walletAddressId: senderPpId,
      amount,
      description: 'Currency exchange',
      isReceive: true,
      receiver: receiverPpUrl
    })

    //OUTCOME
    NodeCacheInstance.set(quote.id, true)
    //INCOME
    NodeCacheInstance.set(urlToPaymentId(quote.receiver), true)
    return quote
  }
}
