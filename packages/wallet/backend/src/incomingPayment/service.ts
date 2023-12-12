import { AccountService } from '@/account/service'
import { NotFound } from '@/errors'
import { PaymentDetails } from '@/incomingPayment/controller'
import { WalletAddress } from '@/walletAddress/model'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { Transaction } from '@/transaction/model'
import { extractUuidFromUrl, transformAmount } from '@/utils/helpers'
import { Amount, Asset } from '@/rafiki/backend/generated/graphql'
import { add } from 'date-fns'
import { Logger } from 'winston'
import axios from 'axios'
import { Env } from '@/config/env'

interface IIncomingPaymentService {
  create: (
    userId: string,
    walletAddressId: string,
    amount: number,
    description: string
  ) => Promise<string>
  getPaymentDetailsByUrl: (url: string) => Promise<PaymentDetails>
}

interface CreateReceiverParams {
  amount: bigint | null
  asset: Pick<Asset, 'code' | 'scale'>
  walletAddressUrl: string
  description?: string
  expiresAt?: Date
}

interface Expiration {
  value: number
  unit: string
}

const unitMapping: Record<string, keyof Duration> = {
  s: 'seconds',
  m: 'minutes',
  h: 'hours',
  d: 'days'
}

export interface IExternalPayment {
  authServer: string
  receivedAmount: Pick<Amount, 'value' | 'assetCode' | 'assetScale'>
}

export class IncomingPaymentService implements IIncomingPaymentService {
  constructor(
    private accountService: AccountService,
    private rafikiClient: RafikiClient,
    private logger: Logger,
    private env: Env
  ) {}

  async create(
    userId: string,
    walletAddressId: string,
    amount: number,
    description?: string,
    expiration?: Expiration
  ): Promise<string> {
    const existingWalletAddress =
      await WalletAddress.query().findById(walletAddressId)
    if (!existingWalletAddress || !existingWalletAddress.active) {
      throw new NotFound()
    }

    const { assetId } = await this.accountService.findAccountById(
      existingWalletAddress.accountId,
      userId
    )
    const asset = await this.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    let expiryDate: Date | undefined

    if (expiration) {
      expiryDate = add(
        new Date(),
        this.generateExpiryObject(expiration.value, expiration.unit)
      )
    }

    const response = await this.rafikiClient.createReceiver({
      walletAddressUrl: existingWalletAddress.url,
      description,
      asset,
      amount: BigInt(amount * 10 ** asset.scale),
      expiresAt: expiryDate
    })

    return response.id
  }

  // Instead of querying our Transaction model, should we fetch this information from Rafiki?
  // Reasoning:
  // - An incoming payment can be fulfilled by multiple outgoing payments;
  // - If we have an incoming payment that awaits $10 and we send $5 initially,
  //   inserting the IP URL in the receiver field again, currently shows that the incoming amount
  //   is still $10.
  // - By fetching the IP details from Rafiki, we can calculate how much more is needed
  //   to fulfill this specific IP (after making an initial outgoing payment of $5).
  async getPaymentDetailsByUrl(url: string): Promise<PaymentDetails> {
    const id = extractUuidFromUrl(url)

    const transaction = await Transaction.query()
      .where('paymentId', id)
      .where('status', 'PENDING')
      .first()
      .withGraphFetched({ walletAddress: { account: true } })

    if (!transaction) {
      throw new NotFound(
        'The provided incoming payment URL could not be found.'
      )
    }

    const asset = await this.rafikiClient.getAssetById(
      transaction.walletAddress?.account.assetId
    )
    if (!asset) {
      throw new NotFound()
    }

    return {
      description: transaction.description,
      value: parseFloat(transformAmount(transaction.value ?? 0n, asset.scale)),
      assetCode: transaction.assetCode
    }
  }

  public async getReceiver(receiver: string) {
    try {
      // @TODO: replace with get receiver from rafiki when implemented
      return await this.getPaymentDetailsByUrl(receiver)
    } catch (_e) {
      this.logger.info(`Could not find transaction for ${receiver}`)
    }
  }

  public async createReceiver(params: CreateReceiverParams): Promise<string> {
    const response = await this.rafikiClient.createReceiver(params)
    // id is the incoming payment url
    return response.id
  }

  private generateExpiryObject(expiry: number, unit: string): Duration {
    return unitMapping[unit] ? { [unitMapping[unit]]: expiry } : { days: 30 }
  }

  public async getExternalPayment(url: string): Promise<IExternalPayment> {
    const headers = {
      'Host': new URL(url).host,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    url =
      this.env.NODE_ENV === 'development'
        ? url.replace('https://', 'http://')
        : url
    const res = await axios.get(url, { headers })
    return res.data
  }
}
