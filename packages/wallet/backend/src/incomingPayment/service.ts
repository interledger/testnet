import { AccountService } from '@/account/service'
import { WalletAddress } from '@/walletAddress/model'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformAmount } from '@/utils/helpers'
import { Amount, Asset } from '@/rafiki/backend/generated/graphql'
import { add, Duration } from 'date-fns'
import axios from 'axios'
import { Env } from '@/config/env'
import { NotFound } from '@shared/backend'
import { PaymentDetailsResponse } from '@wallet/shared'

interface IIncomingPaymentService {
  create: (
    userId: string,
    walletAddressId: string,
    amount: number,
    description: string
  ) => Promise<string>
  getPaymentDetailsByUrl: (url: string) => Promise<PaymentDetailsResponse>
}

interface CreateReceiverParams {
  amount: bigint | null
  asset: Pick<Asset, 'code' | 'scale'>
  walletAddressUrl: string
  description?: string
  expiresAt?: Date
  vopNonce: string
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
      expiresAt: expiryDate,
      vopNonce: ''
    })

    return response.id
  }

  async getPaymentDetailsByUrl(url: string): Promise<PaymentDetailsResponse> {
    const receiver = await this.rafikiClient.getReceiverById(url)
    const asset = {
      scale:
        receiver.incomingAmount?.assetScale ??
        receiver.receivedAmount.assetScale,
      code:
        receiver.incomingAmount?.assetCode ?? receiver.receivedAmount.assetCode
    }

    const value = receiver.incomingAmount?.value
      ? receiver.incomingAmount.value - receiver.receivedAmount.value
      : 0n

    return {
      description: receiver.metadata.description,
      value: parseFloat(transformAmount(value, asset.scale)),
      assetCode: asset.code
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
