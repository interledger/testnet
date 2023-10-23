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
import { Knex } from 'knex'
import { WMTransactionService } from '@/webMonetization/transaction/service'
import { PartialModelObject, TransactionOrKnex, raw } from 'objection'
import { RapydClient } from '@/rapyd/rapyd-client'
import { TransactionType } from '@/transaction/model'

interface HandleBalanceParams {
  type: TransactionType
  balance: bigint
  paymentPointer: PaymentPointer
}

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

export type UpdatePaymentPointerBalanceArgs = {
  paymentPointerId: string
  balance: number
}

export type GetPaymentPointerArgs = {
  paymentPointerId: string
  accountId?: string
  userId?: string
}

export type PaymentPointerList = {
  wmPaymentPointers: PaymentPointer[]
  paymentPointers: PaymentPointer[]
}
interface IPaymentPointerService {
  create: (params: CreatePaymentPointerArgs) => Promise<PaymentPointer>
  update: (args: UpdatePaymentPointerArgs) => Promise<void>
  list: (userId: string, accountId: string) => Promise<PaymentPointerList>
  getById: (args: GetPaymentPointerArgs) => Promise<PaymentPointer>
  softDelete: (userId: string, id: string) => Promise<void>
}

interface PaymentPointerServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  env: Env
  cache: Cache<PaymentPointer>
  knex: Knex
  wmTransactionService: WMTransactionService
  rapydClient: RapydClient
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
          throw new NotFound('Web monetization asset not found.')
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
        isWM: args.isWM
      })

      args.isWM &&
        (await this.deps.cache.set(paymentPointer.id, paymentPointer, {
          expiry: 60
        }))
    }

    return paymentPointer
  }

  async list(userId: string, accountId: string): Promise<PaymentPointerList> {
    const account = await this.deps.accountService.findAccountById(
      accountId,
      userId
    )

    const paymentPointersResult = await PaymentPointer.query()
      .where('accountId', account.id)
      .where('active', true)

    const result = paymentPointersResult.reduce(
      (acc, pp) => {
        if (pp.isWM) {
          acc.wmPaymentPointers.push(pp)
        } else {
          acc.paymentPointers.push(pp)
        }
        return acc
      },
      {
        wmPaymentPointers: [] as PaymentPointer[],
        paymentPointers: [] as PaymentPointer[]
      }
    )

    return result
  }

  async listAll(userId: string): Promise<PaymentPointer[]> {
    return PaymentPointer.query()
      .where({ isWM: false, active: true })
      .joinRelated('account')
      .where({
        'account.userId': userId
      })
  }

  async getById(args: GetPaymentPointerArgs): Promise<PaymentPointer> {
    //* Cache only contains PaymentPointers with isWM = true
    const cacheHit = await this.deps.cache.get(args.paymentPointerId)
    if (cacheHit) {
      //* TODO: reset ttl
      return cacheHit
    }

    if (args.userId && args.accountId) {
      await this.deps.accountService.findAccountById(
        args.accountId,
        args.userId
      )
    }

    const query = PaymentPointer.query()
      .findById(args.paymentPointerId)
      .where('active', true)
    if (args.accountId) {
      query.where('accountId', args.accountId)
    }
    const paymentPointer = await query

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

  // async updateBalance(args: UpdatePaymentPointerBalanceArgs): Promise<void> {
  //   const { paymentPointerId, balance } = args

  //   const paymentPointer = await this.getById({ paymentPointerId })
  //   if (!paymentPointer) {
  //     throw new NotFound(`Web monetization payment pointer does not exist.`)
  //   }
  //   await paymentPointer.$query().patch({ balance })
  // }

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
    //* Cache only contains PaymentPointers with isWM = true
    const cacheHit = await this.deps.cache.get(id)
    if (cacheHit) {
      //* TODO: reset ttl
      return cacheHit
    }

    const paymentPointer = await PaymentPointer.query()
      .findById(id)
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

  private async handleBalance(
    { type, balance, paymentPointer }: HandleBalanceParams,
    trx: TransactionOrKnex
  ): Promise<void> {
    const amount =
      Number(balance * this.deps.env.WM_THRESHOLD) *
      10 ** -paymentPointer.assetScale!

    let destination = paymentPointer.account.virtualAccountId
    let source = this.deps.env.RAPYD_SETTLEMENT_EWALLET

    if (type === 'OUTGOING') {
      destination = this.deps.env.RAPYD_SETTLEMENT_EWALLET
      source = paymentPointer.account.virtualAccountId
    }

    const transfer = await this.deps.rapydClient.transferLiquidity({
      amount,
      currency: paymentPointer.assetCode!,
      destination_ewallet: destination,
      source_ewallet: source
    })

    if (transfer.status?.status !== 'SUCCESS') {
      if (type === 'OUTGOING') {
        await paymentPointer.$relatedQuery('account', trx).patch({
          debt: raw('?? + ?', ['debt', amount])
        })
        return
      }

      throw new Error(
        `Unable to transfer from ${source} into ${destination} error message: ${
          transfer.status?.message || 'unknown'
        }`
      )
    }

    let updatePart: PartialModelObject<PaymentPointer> = {
      incomingBalance: raw('?? - ?', [
        'incomingBalance',
        this.deps.env.WM_THRESHOLD * balance
      ])
    }

    if (type === 'OUTGOING') {
      updatePart = {
        outgoingBalance: raw('?? - ?', [
          'outgoingBalance',
          this.deps.env.WM_THRESHOLD * balance
        ])
      }
    }

    Promise.all([
      paymentPointer.$relatedQuery('transactions', trx).insert({
        accountId: paymentPointer.accountId,
        paymentId: transfer.data.id,
        assetCode: paymentPointer.assetCode!,
        value: BigInt(amount * 10 ** this.deps.env.BASE_ASSET_SCALE),
        type,
        status: 'COMPLETED',
        description: 'Web Monetization'
      }),
      paymentPointer.$query(trx).update(updatePart)
    ])
  }

  async processWMPaymentPointers(): Promise<void> {
    console.log('Processing WM payment pointers')
    return this.deps.knex.transaction(async (trx) => {
      const paymentPointers = await PaymentPointer.query(trx)
        .where({
          isWM: true,
          active: true
        })
        .withGraphFetched('account')

      for (const paymentPointer of paymentPointers) {
        if (!paymentPointer.assetCode || !paymentPointer.assetScale) {
          throw new Error('Asset code or scale is missing')
        }

        const [incoming, outgoing] = await Promise.all([
          this.deps.wmTransactionService.sumByPaymentPointerId(
            paymentPointer.id,
            'INCOMING',
            trx
          ),
          this.deps.wmTransactionService.sumByPaymentPointerId(
            paymentPointer.id,
            'OUTGOING',
            trx
          )
        ])

        console.log(incoming)
        console.log(outgoing)

        const tmpPaymentPointer = await paymentPointer
          .$query(trx)
          .updateAndFetchById(paymentPointer.id, {
            incomingBalance: raw('?? + ?', ['incomingBalance', incoming.sum]),
            outgoingBalance: raw('?? + ?', ['outgoingBalance', outgoing.sum])
          })

        await this.deps.wmTransactionService.deleteByTransactionIds(
          incoming.ids.concat(outgoing.ids)
        )

        const incomingBalance =
          tmpPaymentPointer.incomingBalance / this.deps.env.WM_THRESHOLD
        const outgoingBalance =
          tmpPaymentPointer.outgoingBalance / this.deps.env.WM_THRESHOLD

        if (incomingBalance > 0n) {
          await this.handleBalance(
            {
              balance: incomingBalance,
              paymentPointer,
              type: 'INCOMING'
            },
            trx
          )
        }

        if (outgoingBalance > 0n) {
          await this.handleBalance(
            {
              balance: outgoingBalance,
              paymentPointer,
              type: 'OUTGOING'
            },
            trx
          )
        }
      }
    })
  }
}
