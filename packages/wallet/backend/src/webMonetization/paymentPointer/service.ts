import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { Conflict, NotFound } from '@/errors'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { generateJwk } from '@/utils/jwk'
import { generateKeyPairSync } from 'crypto'
import { v4 as uuid } from 'uuid'
import { CacheService } from '../../cache/service'
import { PaymentPointer } from '../../paymentPointer/model'
import { WMPaymentPointer } from './model'






export type UpdateWMPaymentPointerBalanceArgs = {
  accountId: string
  paymentPointerId: string,
  balance: number
}

interface IWMPaymentPointerService {
  create: (params: CreateWMPaymentPointerParams) => Promise<PaymentPointer>
  getById: (
    userId: string,
    accountId: string,
    id: string
  ) => Promise<PaymentPointer>
  updateBalance: (args:  UpdateWMPaymentPointerBalanceArgs) => Promise<void>
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
    accountId: string,
    id: string
  ): Promise<WMPaymentPointer> {
    const cacheHit = await this.deps.cache.get<WMPaymentPointer>(id);

    if(cacheHit){
        return cacheHit
    }

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

  async updateBalance(args: UpdateWMPaymentPointerBalanceArgs): Promise<void> {
    const { accountId, paymentPointerId, balance } = args

    const wmPaymentPointer = await this.getById(
      accountId,
      paymentPointerId
    )
    await wmPaymentPointer.$query().patch({ balance: BigInt(balance) })
   
  }
  

  async registerKey(
    accountId: string,
    wmPaymentPointerId: string
  ): Promise<{ privateKey: string; publicKey: string; keyId: string }> {
    const wmPaymentPointer = await this.getById(
      accountId,
      wmPaymentPointerId
    )

    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const publicKeyPEM = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()
    const privateKeyPEM = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
    const keyId = uuid()

    const wmPaymentPointerKey = await this.deps.rafikiClient.createRafikiPaymentPointerKey(
        generateJwk(privateKey, keyId),
        wmPaymentPointer.id
      )

    const key = {
      id: keyId,
      rafikiId: wmPaymentPointerKey.id,
      publicKey: publicKeyPEM,
      createdOn: new Date()
    }

    await WMPaymentPointer.query().findById(wmPaymentPointerId).patch({
      keyIds: key
    })

    return { privateKey: privateKeyPEM, publicKey: publicKeyPEM, keyId: key.id }
  }

  async revokeKey(
    accountId: string,
    wmPaymentPointerId: string
  ): Promise<void> {
    const wmPaymentPointer = await this.getById(
      accountId,
      wmPaymentPointerId
    )

    if (!wmPaymentPointer.keyIds) {
      return
    }

    const trx = await WMPaymentPointer.startTransaction()
    try {
      await Promise.all([
        wmPaymentPointer.$query(trx).patch({ keyIds: null }),
        this.deps.rafikiClient.revokePaymentPointerKey(
          wmPaymentPointer.keyIds.rafikiId
        )
      ])
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
}

}
