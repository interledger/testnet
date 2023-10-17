import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { Conflict, NotFound } from '@/errors'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { CacheService } from '../../cache/service'
import { PaymentPointer } from '../../paymentPointer/model'
import { WMPaymentPointer } from './model'

export type UpdateWMPaymentPointerBalanceArgs = {
  accountId: string
  paymentPointerId: string
  balance: number
}

interface IWMPaymentPointerService {
  create: (params: CreateWMPaymentPointerParams) => Promise<PaymentPointer>
  getById: (
    userId: string,
    accountId: string,
    id: string
  ) => Promise<PaymentPointer>
  updateBalance: (args: UpdateWMPaymentPointerBalanceArgs) => Promise<void>
}

interface WMPaymentPointerServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  env: Env
  cache: CacheService
}

type CreateWMPaymentPointerParams = {
  userId: string
  accountId: string
  paymentPointerName: string
  publicName: string
}

export class WMPaymentPointerService implements IWMPaymentPointerService {
  constructor(private deps: WMPaymentPointerServiceDependencies) {}

  async create(
    params: CreateWMPaymentPointerParams
  ): Promise<WMPaymentPointer> {
    const account = await this.deps.accountService.findAccountById(
      params.accountId,
      params.userId
    )

    const url = `${this.deps.env.OPEN_PAYMENTS_HOST}/${params.paymentPointerName}`
    let wmPaymentPointer = await WMPaymentPointer.query().findOne({ url })

    if (wmPaymentPointer) {
      if (
        wmPaymentPointer.accountId != params.accountId ||
        account.userId !== params.userId
      ) {
        throw new Conflict(
          'This payment pointer already exists. Please choose another name.'
        )
      }
    }

    //* Web monetization requires an asset with scale 9 to exist.
    const webMonetizationAsset = await this.deps.rafikiClient.getRafikiAsset(
      'USD',
      9
    )

    if (!webMonetizationAsset) {
      throw new NotFound('Asset with assetScale 9 not found')
    }

    const rafikiPaymentPointer =
      await this.deps.rafikiClient.createRafikiPaymentPointer(
        params.publicName,
        webMonetizationAsset.id,
        url
      )

    wmPaymentPointer = await WMPaymentPointer.query().insert({
      assetCode: webMonetizationAsset.code,
      assetScale: webMonetizationAsset.scale,
      url: rafikiPaymentPointer.url,
      publicName: params.publicName,
      accountId: params.accountId,
      id: rafikiPaymentPointer.id
    })

    await this.deps.cache.set(wmPaymentPointer.id, wmPaymentPointer, {
      expiry: 60
    })

    return wmPaymentPointer
  }

  async getById(accountId: string, id: string): Promise<WMPaymentPointer> {
    const cacheHit = await this.deps.cache.get<WMPaymentPointer>(id)

    if (cacheHit) {
      return cacheHit
    }

    const wmPaymentPointer = await WMPaymentPointer.query()
      .findById(id)
      .where('accountId', accountId)
      .where('active', true)

    if (!wmPaymentPointer) {
      throw new NotFound()
    }

    await this.deps.cache.set(wmPaymentPointer.id, wmPaymentPointer, {
      expiry: 60
    })

    return wmPaymentPointer
  }

  async updateBalance(args: UpdateWMPaymentPointerBalanceArgs): Promise<void> {
    const { accountId, paymentPointerId, balance } = args

    const wmPaymentPointer = await this.getById(accountId, paymentPointerId)
    await wmPaymentPointer.$query().patch({ balance: BigInt(balance) })
  }
}
