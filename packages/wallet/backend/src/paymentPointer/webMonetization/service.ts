import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { Conflict, NotFound } from '@/errors'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { CacheService } from '../../cache/service'
import { PaymentPointer } from '../model'
import { UpdatePaymentPointerArgs } from '../service'
import { WMPaymentPointer } from './model'



type UpdateWMPaymentPointerArgs = UpdatePaymentPointerArgs & {
    assetCode: string
    assetScale: number
    balance: number
  }

interface IWMPaymentPointerService {
  create: (params: CreateWMPaymentPointerParams) => Promise<PaymentPointer>
  getById: (
    userId: string,
    accountId: string,
    id: string
  ) => Promise<PaymentPointer>
  updateBalance: (args: UpdateWMPaymentPointerArgs) => Promise<void>
}

interface WMPaymentPointerServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  env: Env,
  cache: CacheService
}


type CreateWMPaymentPointerParams = {
    userId: string,
    accountId: string,
    paymentPointerName: string,
    publicName: string,
    assetScale: number,
    assetCode: string,
}


export class WMPaymentPointerService implements IWMPaymentPointerService {
  constructor(private deps: WMPaymentPointerServiceDependencies) {}


  async create(
   params: CreateWMPaymentPointerParams
  ): Promise<PaymentPointer> {
    const account = await this.deps.accountService.findAccountById(
        params.accountId,
        params.userId
    )

    const url = `${this.deps.env.OPEN_PAYMENTS_HOST}/${params.paymentPointerName}`
    let wmPaymentPointer = await WMPaymentPointer.query().findOne({ url })

    if (wmPaymentPointer) {
      if (wmPaymentPointer.accountId != params.accountId || account.userId !== params.userId) {
        throw new Conflict(
          'This payment pointer already exists. Please choose another name.'
        )
      }
    }

    const rafikiPaymentPointer = await this.deps.rafikiClient.createRafikiPaymentPointer(
        params.publicName,
        account.assetId,
        url
    )

      wmPaymentPointer = await WMPaymentPointer.query().insert({
        assetCode: params.assetCode,
        assetScale: params.assetScale,
        url: rafikiPaymentPointer.url,
        publicName: params.publicName,
        accountId: params.accountId,
        id: rafikiPaymentPointer.id
      })

    await this.deps.cache.set(wmPaymentPointer.id, wmPaymentPointer, {expiry: 60});
    
    return wmPaymentPointer
  }

  async getById(
    userId: string,
    accountId: string,
    id: string
  ): Promise<WMPaymentPointer> {
    const cacheHit = await this.deps.cache.get<WMPaymentPointer>(id);

    if(cacheHit){
        return cacheHit
    }

    // Validate that account id belongs to current user
    await this.deps.accountService.findAccountById(accountId, userId)

    const wmPaymentPointer = await WMPaymentPointer.query()
      .findById(id)
      .where('accountId', accountId)
      .where('active', true)

      if (!wmPaymentPointer) {
        throw new NotFound()
      }

      await this.deps.cache.set(wmPaymentPointer.id, wmPaymentPointer, {expiry: 60})

      return wmPaymentPointer
    
  }


  async updateBalance(args: UpdateWMPaymentPointerArgs): Promise<void> {
    const { userId, accountId, paymentPointerId, publicName } = args

    const paymentPointer = await this.getById(
      userId,
      accountId,
      paymentPointerId
    )

    const trx = await PaymentPointer.startTransaction()

    try {
      await Promise.all([
        paymentPointer.$query(trx).patch({ publicName }),
        this.deps.rafikiClient.updatePaymentPointer({
          id: paymentPointerId,
          publicName
        })
      ])
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }





}
