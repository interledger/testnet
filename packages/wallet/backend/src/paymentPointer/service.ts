import { Account } from '@/account/model'
import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { Conflict, NotFound } from '@/errors'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { generateJwk } from '@/utils/jwk'
import axios from 'axios'
import { generateKeyPairSync, getRandomValues } from 'crypto'
import { v4 as uuid } from 'uuid'
import { Cache } from '../cache/service'
import { PaymentPointer } from './model'

export interface UpdatePaymentPointerArgs {
  userId: string
  accountId: string
  paymentPointerId: string
  publicName: string
}

export interface ExternalPaymentPointer {
  url: string
  publicName: string
  assetCode: string
  assetScale: number
  authServer: string
}

export interface CreatePaymentPointerArgs {
  userId: string
  accountId: string
  paymentPointerName: string
  publicName: string
  isWM: boolean
}

interface IPaymentPointerService {
  create: (params: CreatePaymentPointerArgs) => Promise<PaymentPointer>
  update: (args: UpdatePaymentPointerArgs) => Promise<void>
  list: (
    userId: string,
    accountId: string,
    isWM: boolean
  ) => Promise<PaymentPointer[]>
  getById: (args: GetPaymentPointerArgs) => Promise<PaymentPointer>
  softDelete: (userId: string, id: string) => Promise<void>
}

interface PaymentPointerServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  env: Env
  cache: Cache<PaymentPointer>
}

export const createPaymentPointerIfFalsy = async ({
  paymentPointer,
  userId,
  accountId,
  publicName,
  paymentPointerService
}: {
  paymentPointer: PaymentPointer
  userId: string
  accountId: string
  publicName: string
  paymentPointerService: PaymentPointerService
}): Promise<PaymentPointer> => {
  if (paymentPointer) {
    return paymentPointer
  }

  const newPaymentPointer = await paymentPointerService.create({
    userId,
    accountId,
    paymentPointerName: getRandomValues(new Uint32Array(1))[0].toString(16),
    publicName,
    isWM: false
  })

  return newPaymentPointer
}
export type UpdatePaymentPointerBalanceArgs = {
  accountId: string
  paymentPointerId: string
  balance: number
}

export type GetPaymentPointerArgs = {
  paymentPointerId: string
  accountId: string
  userId?: string
}

export class PaymentPointerService implements IPaymentPointerService {
  constructor(private deps: PaymentPointerServiceDependencies) {}

  async create(args: CreatePaymentPointerArgs): Promise<PaymentPointer> {
    const account = await this.deps.accountService.findAccountById(
      args.accountId,
      args.userId
    )
    const url = `${this.deps.env.OPEN_PAYMENTS_HOST}/${args.paymentPointerName}`
    let paymentPointer = await PaymentPointer.query().findOne({ url })

    if (paymentPointer) {
      if (
        paymentPointer.accountId != args.accountId ||
        account.userId !== args.userId
      ) {
        throw new Conflict(
          'This payment pointer already exists. Please choose another name.'
        )
      } else if (
        paymentPointer.accountId === args.accountId &&
        account.userId === args.userId
      ) {
        paymentPointer = await PaymentPointer.query().patchAndFetchById(
          paymentPointer.id,
          {
            publicName: args.publicName,
            active: true
          }
        )
      }
    } else {
      const rafikiPaymentPointer =
        await this.deps.rafikiClient.createRafikiPaymentPointer(
          args.publicName,
          account.assetId,
          url
        )

      let assetScale = null
      let assetCode = null
      if (args.isWM) {
        //* Web monetization feature requires an asset with scale MAX_ASSET_SCALE to exist. It's default assetCode is USD for now
        const webMonetizationAsset =
          await this.deps.rafikiClient.getRafikiAsset(
            'USD',
            this.deps.env.MAX_ASSET_SCALE
          )

        if (!webMonetizationAsset) {
          throw new NotFound('Web monetization asset not found')
        }

        assetScale = webMonetizationAsset.scale
        assetCode = webMonetizationAsset.code
      }

      paymentPointer = await PaymentPointer.query().insert({
        url: rafikiPaymentPointer.url,
        publicName: args.publicName,
        accountId: args.accountId,
        id: rafikiPaymentPointer.id,
        assetCode,
        assetScale,
        balance: 0,
        isWM: args.isWM
      })

      args.isWM &&
        (await this.deps.cache.set(paymentPointer.id, paymentPointer, {
          expiry: 60
        }))
    }

    return paymentPointer
  }

  async list(
    userId: string,
    accountId: string,
    isWM: boolean
  ): Promise<PaymentPointer[]> {
    const account = await this.deps.accountService.findAccountById(
      accountId,
      userId
    )
    return PaymentPointer.query()
      .where('accountId', account.id)
      .where('active', true)
      .where('isWM', isWM)
  }

  async listAll(userId: string): Promise<PaymentPointer[]> {
    return PaymentPointer.query()
      .where({ isWM: false })
      .joinRelated('account')
      .where({
        'account.userId': userId,
        'paymentPointers.active': true
      })
  }

  async getById(args: GetPaymentPointerArgs): Promise<PaymentPointer> {
    //* Cache only contains PaymentPointers with isWM = true
    const cacheHit = await this.deps.cache.get(
      args.paymentPointerId
    )
    if (cacheHit) {
      //* TODO: reset ttl
      return cacheHit
    }

    if (args.userId) {
      await this.deps.accountService.findAccountById(
        args.accountId,
        args.userId
      )
    }

    const paymentPointer = await PaymentPointer.query()
      .findById(args.paymentPointerId)
      .where('accountId', args.accountId)
      .where('active', true)

    if (!paymentPointer) {
      throw new NotFound()
    }

    if (paymentPointer.isWM) {
      await this.deps.cache.set(paymentPointer.id, paymentPointer, {
        expiry: 60
      })
    }

    return paymentPointer
  }

  async updateBalance(args: UpdatePaymentPointerBalanceArgs): Promise<void> {
    const { accountId, paymentPointerId, balance } = args

    const paymentPointer = await this.getById({ accountId, paymentPointerId })
    if (!paymentPointer) {
      throw new NotFound(`WM Payment pointer does not exist`)
    }
    await paymentPointer.$query().patch({ balance })
  }

  async listIdentifiersByUserId(userId: string): Promise<string[]> {
    const accounts = await Account.query()
      .where('userId', userId)
      .withGraphFetched('paymentPointers')

    return accounts.flatMap((account) =>
      account.paymentPointers.map(({ url }) => url)
    )
  }

  async belongsToUser(userId: string, url: string): Promise<boolean> {
    const paymentPointer = await PaymentPointer.query()
      .findOne({ url })
      .withGraphFetched('account')
      .modifyGraph('account', (builder) => {
        builder.where({ userId })
      })

    return !!paymentPointer?.account
  }

  /**
   * This is a soft delete functionality. The payment pointer will never be
   * deleted. We will change its `active` column to `false` when the user
   * wants to delete it.
   * */
  async softDelete(userId: string, id: string): Promise<void> {
    const paymentPointer = await PaymentPointer.query().findById(id)

    if (!paymentPointer) {
      throw new NotFound()
    }

    // Check if the user owns the payment pointer.
    // This function throws a NotFoundException.
    await this.deps.accountService.findAccountById(
      paymentPointer.accountId,
      userId
    )
    await PaymentPointer.query().findById(id).patch({
      active: false
    })
  }

  async registerKey(
    userId: string,
    accountId: string,
    paymentPointerId: string
  ): Promise<{ privateKey: string; publicKey: string; keyId: string }> {
    const paymentPointer = await this.getById({
      userId,
      accountId,
      paymentPointerId
    })
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const publicKeyPEM = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()
    const privateKeyPEM = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()
    const keyId = uuid()

    const paymentPointerKey =
      await this.deps.rafikiClient.createRafikiPaymentPointerKey(
        generateJwk(privateKey, keyId),
        paymentPointer.id
      )

    const key = {
      id: keyId,
      rafikiId: paymentPointerKey.id,
      publicKey: publicKeyPEM,
      createdOn: new Date()
    }

    await PaymentPointer.query().findById(paymentPointerId).patch({
      keyIds: key
    })

    return { privateKey: privateKeyPEM, publicKey: publicKeyPEM, keyId: key.id }
  }

  async revokeKey(
    userId: string,
    accountId: string,
    paymentPointerId: string
  ): Promise<void> {
    const paymentPointer = await this.getById({
      userId,
      accountId,
      paymentPointerId
    })

    if (!paymentPointer.keyIds) {
      return
    }

    const trx = await PaymentPointer.startTransaction()

    try {
      await Promise.all([
        paymentPointer.$query(trx).patch({ keyIds: null }),
        this.deps.rafikiClient.revokePaymentPointerKey(
          paymentPointer.keyIds.rafikiId
        )
      ])
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  async update(args: UpdatePaymentPointerArgs): Promise<void> {
    const { userId, accountId, paymentPointerId, publicName } = args
    const paymentPointer = await this.getById({
      userId,
      accountId,
      paymentPointerId
    })

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

  public async getExternalPaymentPointer(
    url: string
  ): Promise<ExternalPaymentPointer> {
    const headers = {
      'Host': new URL(url).host,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
    url =
      this.deps.env.NODE_ENV === 'development'
        ? url.replace('https://', 'http://')
        : url
    const res = await axios.get(url, { headers })
    return res.data
  }

  async findByIdWithoutValidation(id: string) {
    const paymentPointer = await PaymentPointer.query()
      .findById(id)
      .where('active', true)

    if (!paymentPointer) {
      throw new NotFound()
    }

    return paymentPointer
  }
}
