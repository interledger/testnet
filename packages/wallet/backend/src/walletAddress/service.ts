import { Account } from '@/account/model'
import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { BadRequest, Conflict, NotFound } from '@/errors'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { generateJwk } from '@/utils/jwk'
import axios from 'axios'
import {
  generateKeyPairSync,
  getRandomValues,
  createPublicKey,
  createPrivateKey
} from 'crypto'
import { v4 as uuid } from 'uuid'
import { Cache } from '@/cache/service'
import { WalletAddress } from './model'
import { WMTransactionService } from '@/webMonetization/transaction/service'
import { PartialModelObject, TransactionOrKnex, raw } from 'objection'
import { RapydClient } from '@/rapyd/rapyd-client'
import { TransactionType } from '@/transaction/model'
import { Logger } from 'winston'

interface HandleBalanceParams {
  type: TransactionType
  balance: bigint
  walletAddress: WalletAddress
}

export interface UpdateWalletAddressArgs {
  userId: string
  accountId: string
  walletAddressId: string
  publicName: string
}

export interface ExternalWalletAddress {
  url: string
  publicName: string
  assetCode: string
  assetScale: number
  authServer: string
}

export interface CreateWalletAddressArgs {
  userId: string
  accountId: string
  walletAddressName: string
  publicName: string
  isWM: boolean
}

export type UpdateWalletAddressBalanceArgs = {
  walletAddressId: string
  balance: number
}

export type GetWalletAddressArgs = {
  walletAddressId: string
  accountId?: string
  userId?: string
}

export type WalletAddressList = {
  wmWalletAddresses: WalletAddress[]
  walletAddresses: WalletAddress[]
}
interface IWalletAddressService {
  create: (params: CreateWalletAddressArgs) => Promise<WalletAddress>
  update: (args: UpdateWalletAddressArgs) => Promise<void>
  list: (userId: string, accountId: string) => Promise<WalletAddressList>
  getById: (args: GetWalletAddressArgs) => Promise<WalletAddress>
  softDelete: (userId: string, id: string) => Promise<void>
}

export const createWalletAddressIfFalsy = async ({
  walletAddress,
  userId,
  accountId,
  publicName,
  walletAddressService
}: {
  walletAddress: WalletAddress
  userId: string
  accountId: string
  publicName: string
  walletAddressService: WalletAddressService
}): Promise<WalletAddress> => {
  if (walletAddress) {
    return walletAddress
  }

  const newWalletAddress = await walletAddressService.create({
    userId,
    accountId,
    walletAddressName: getRandomValues(new Uint32Array(1))[0].toString(16),
    publicName,
    isWM: false
  })

  return newWalletAddress
}

export class WalletAddressService implements IWalletAddressService {
  constructor(
    private accountService: AccountService,
    private rafikiClient: RafikiClient,
    private env: Env,
    private cache: Cache<WalletAddress>,
    private wmTransactionService: WMTransactionService,
    private rapydClient: RapydClient,
    private logger: Logger
  ) {}

  async create(args: CreateWalletAddressArgs): Promise<WalletAddress> {
    const account = await this.accountService.findAccountById(
      args.accountId,
      args.userId
    )
    const url = `${this.env.OPEN_PAYMENTS_HOST}/${args.walletAddressName}`
    let walletAddress = await WalletAddress.query().findOne({ url })

    if (walletAddress) {
      if (
        walletAddress.accountId != args.accountId ||
        account.userId !== args.userId
      ) {
        throw new Conflict(
          'This payment pointer already exists. Please choose another name.'
        )
      } else if (
        walletAddress.accountId === args.accountId &&
        account.userId === args.userId
      ) {
        walletAddress = await WalletAddress.query().patchAndFetchById(
          walletAddress.id,
          {
            publicName: args.publicName,
            active: true
          }
        )
      }
    } else {
      let webMonetizationAsset
      if (args.isWM) {
        // @TEMPORARY: Enable WM only for USD
        if (account.assetCode !== 'USD') {
          throw new BadRequest(
            'Web Monetization is enabled exclusively for USD.'
          )
        }

        webMonetizationAsset = await this.rafikiClient.getRafikiAsset(
          'USD',
          this.env.MAX_ASSET_SCALE
        )

        if (!webMonetizationAsset) {
          throw new NotFound('Web monetization asset not found.')
        }
      }

      const assetId = webMonetizationAsset?.id || account.assetId
      const rafikiWalletAddress =
        await this.rafikiClient.createRafikiWalletAddress(
          args.publicName,
          assetId,
          url
        )

      walletAddress = await WalletAddress.query().insert({
        url: rafikiWalletAddress.url,
        publicName: args.publicName,
        accountId: args.accountId,
        id: rafikiWalletAddress.id,
        isWM: args.isWM,
        assetCode: webMonetizationAsset?.code,
        assetScale: webMonetizationAsset?.scale
      })

      args.isWM &&
        (await this.cache.set(walletAddress.id, walletAddress, {
          expiry: 60
        }))
    }

    return walletAddress
  }

  async list(userId: string, accountId: string): Promise<WalletAddressList> {
    const account = await this.accountService.findAccountById(accountId, userId)

    const walletAddressesResult = await WalletAddress.query()
      .where('accountId', account.id)
      .where('active', true)

    const result = walletAddressesResult.reduce(
      (acc, pp) => {
        if (pp.isWM) {
          acc.wmWalletAddresses.push(pp)
        } else {
          acc.walletAddresses.push(pp)
        }
        return acc
      },
      {
        wmWalletAddresses: [] as WalletAddress[],
        walletAddresses: [] as WalletAddress[]
      }
    )

    return result
  }

  async listAll(userId: string): Promise<WalletAddress[]> {
    return WalletAddress.query()
      .where({ isWM: false, active: true })
      .joinRelated('account')
      .where({
        'account.userId': userId
      })
  }

  async getById(args: GetWalletAddressArgs): Promise<WalletAddress> {
    //* Cache only contains WalletAddresses with isWM = true
    const cacheHit = await this.cache.get(args.walletAddressId)
    if (cacheHit) {
      //* TODO: reset ttl
      return cacheHit
    }

    if (args.userId && args.accountId) {
      await this.accountService.findAccountById(args.accountId, args.userId)
    }

    const query = WalletAddress.query()
      .findById(args.walletAddressId)
      .where('active', true)
    if (args.accountId) {
      query.where('accountId', args.accountId)
    }
    const walletAddress = await query

    if (!walletAddress) {
      throw new NotFound()
    }

    if (walletAddress.isWM) {
      await this.cache.set(walletAddress.id, walletAddress, {
        expiry: 60
      })
    }

    return walletAddress
  }

  async listIdentifiersByUserId(userId: string): Promise<string[]> {
    const accounts = await Account.query()
      .where('userId', userId)
      .withGraphFetched('walletAddresses')

    return accounts.flatMap((account) =>
      account.walletAddresses.map(({ url }) => url)
    )
  }

  async belongsToUser(userId: string, url: string): Promise<boolean> {
    const walletAddress = await WalletAddress.query()
      .findOne({ url })
      .withGraphFetched('account')
      .modifyGraph('account', (builder) => {
        builder.where({ userId })
      })

    return !!walletAddress?.account
  }

  /**
   * This is a soft delete functionality. The wallet address will never be
   * deleted. We will change its `active` column to `false` when the user
   * wants to delete it.
   * */
  async softDelete(userId: string, id: string): Promise<void> {
    const walletAddress = await WalletAddress.query().findById(id)

    if (!walletAddress) {
      throw new NotFound()
    }

    // Check if the user owns the wallet address.
    // This function throws a NotFoundException.
    await this.accountService.findAccountById(walletAddress.accountId, userId)
    await WalletAddress.query().findById(id).patch({
      active: false
    })
  }

  async registerKey(
    userId: string,
    accountId: string,
    walletAddressId: string,
    defaultAccount?: {
      publicKeyPEM: string
      privateKeyPEM: string
      keyId: string
    }
  ): Promise<{ privateKey: string; publicKey: string; keyId: string }> {
    const walletAddress = await this.getById({
      userId,
      accountId,
      walletAddressId
    })
    let publicKey, privateKey, keyId
    if (!defaultAccount) {
      const generatedPairs = generateKeyPairSync('ed25519')
      publicKey = generatedPairs.publicKey
      privateKey = generatedPairs.privateKey
      keyId = uuid()
    } else {
      publicKey = createPublicKey({
        key: Buffer.from(defaultAccount.publicKeyPEM, 'base64')
      })
      privateKey = createPrivateKey({
        key: Buffer.from(defaultAccount.privateKeyPEM, 'base64')
      })
      keyId = defaultAccount.keyId
    }

    const publicKeyPEM = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString()
    const privateKeyPEM = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString()

    const walletAddressKey =
      await this.rafikiClient.createRafikiWalletAddressKey(
        generateJwk(privateKey, keyId),
        walletAddress.id
      )

    const key = {
      id: keyId,
      rafikiId: walletAddressKey.id,
      publicKey: publicKeyPEM,
      createdOn: new Date()
    }

    await WalletAddress.query().findById(walletAddressId).patch({
      keyIds: key
    })

    return { privateKey: privateKeyPEM, publicKey: publicKeyPEM, keyId: key.id }
  }

  async revokeKey(
    userId: string,
    accountId: string,
    walletAddressId: string
  ): Promise<void> {
    const walletAddress = await this.getById({
      userId,
      accountId,
      walletAddressId
    })

    if (!walletAddress.keyIds) {
      return
    }

    const trx = await WalletAddress.startTransaction()

    try {
      await Promise.all([
        walletAddress.$query(trx).patch({ keyIds: null }),
        this.rafikiClient.revokeWalletAddressKey(walletAddress.keyIds.rafikiId)
      ])
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  async update(args: UpdateWalletAddressArgs): Promise<void> {
    const { userId, accountId, walletAddressId, publicName } = args
    const walletAddress = await this.getById({
      userId,
      accountId,
      walletAddressId
    })

    const trx = await WalletAddress.startTransaction()

    try {
      await Promise.all([
        walletAddress.$query(trx).patch({ publicName }),
        this.rafikiClient.updateWalletAddress({
          id: walletAddressId,
          publicName
        })
      ])
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  public async getExternalWalletAddress(
    url: string
  ): Promise<ExternalWalletAddress> {
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

  async findByIdWithoutValidation(id: string) {
    //* Cache only contains WalletAddresses with isWM = true
    const cacheHit = await this.cache.get(id)
    if (cacheHit) {
      //* TODO: reset ttl
      return cacheHit
    }

    const walletAddress = await WalletAddress.query()
      .findById(id)
      .where('active', true)

    if (!walletAddress) {
      throw new NotFound()
    }

    if (walletAddress.isWM) {
      await this.cache.set(walletAddress.id, walletAddress, {
        expiry: 60
      })
    }

    return walletAddress
  }

  private async handleBalance(
    { type, balance, walletAddress }: HandleBalanceParams,
    trx: TransactionOrKnex
  ): Promise<void> {
    if (!walletAddress.assetCode || !walletAddress.assetScale) {
      throw new Error(
        `Missing asset information for payment pointer "${walletAddress.url} (ID: ${walletAddress.id})"`
      )
    }
    const amount = Number(
      (
        Number(balance * this.env.WM_THRESHOLD) *
        10 ** -walletAddress.assetScale
      ).toPrecision(2)
    )

    if (!walletAddress.account.user.rapydWalletId) {
      throw new Error(
        `Missing Rapyd wallet ID for user "${walletAddress.account.user.id}"`
      )
    }

    let destination = walletAddress.account.user.rapydWalletId
    let source = this.env.RAPYD_SETTLEMENT_EWALLET

    if (type === 'OUTGOING') {
      destination = this.env.RAPYD_SETTLEMENT_EWALLET
      source = walletAddress.account.user.rapydWalletId
    }

    const transfer = await this.rapydClient.transferLiquidity({
      amount,
      currency: walletAddress.assetCode,
      destination_ewallet: destination,
      source_ewallet: source
    })

    if (transfer.status?.status !== 'SUCCESS') {
      if (type === 'OUTGOING') {
        await walletAddress.$relatedQuery('account', trx).patch({
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

    const updatedField: keyof Pick<
      PartialModelObject<WalletAddress>,
      'incomingBalance' | 'outgoingBalance'
    > = type === 'OUTGOING' ? 'outgoingBalance' : 'incomingBalance'
    const updatePart: PartialModelObject<WalletAddress> = {
      [updatedField]: raw('?? - ?', [
        updatedField,
        this.env.WM_THRESHOLD * balance
      ])
    }

    await Promise.all([
      walletAddress.$relatedQuery('transactions', trx).insert({
        accountId: walletAddress.accountId,
        paymentId: transfer.data.id,
        assetCode: walletAddress.assetCode!,
        value: BigInt(amount * 10 ** this.env.BASE_ASSET_SCALE),
        type,
        status: 'COMPLETED',
        description: 'Web Monetization'
      }),
      walletAddress.$query(trx).update(updatePart)
    ])

    this.logger.info(
      `Proccesed WM transactions for payment pointer ${walletAddress.url}. Type: ${type} | Amount: ${amount}`
    )
  }

  async processWMWalletAddresses(): Promise<void> {
    const trx = await WalletAddress.startTransaction()

    try {
      const walletAddresses = await WalletAddress.query(trx)
        .where({
          isWM: true,
          active: true
        })
        .withGraphFetched('account.user')

      for (const walletAddress of walletAddresses) {
        if (!walletAddress.assetCode || !walletAddress.assetScale) {
          throw new Error('Asset code or scale is missing')
        }

        const [incoming, outgoing] = await Promise.all([
          this.wmTransactionService.sumByWalletAddressId(
            walletAddress.id,
            'INCOMING',
            trx
          ),
          this.wmTransactionService.sumByWalletAddressId(
            walletAddress.id,
            'OUTGOING',
            trx
          )
        ])

        const tmpWalletAddress = await walletAddress
          .$query(trx)
          .updateAndFetchById(walletAddress.id, {
            incomingBalance: raw('?? + ?', ['incomingBalance', incoming.sum]),
            outgoingBalance: raw('?? + ?', ['outgoingBalance', outgoing.sum])
          })

        await this.wmTransactionService.deleteByTransactionIds(
          incoming.ids.concat(outgoing.ids),
          trx
        )

        const incomingBalance =
          tmpWalletAddress.incomingBalance / this.env.WM_THRESHOLD
        const outgoingBalance =
          tmpWalletAddress.outgoingBalance / this.env.WM_THRESHOLD

        if (incomingBalance > 0n) {
          await this.handleBalance(
            {
              balance: incomingBalance,
              walletAddress,
              type: 'INCOMING'
            },
            trx
          )
        }

        if (outgoingBalance > 0n) {
          await this.handleBalance(
            {
              balance: outgoingBalance,
              walletAddress,
              type: 'OUTGOING'
            },
            trx
          )
        }
      }
      await trx.commit()
    } catch (e) {
      this.logger.error(e)
      await trx.rollback()
      throw new Error('Error while processing WM payment pointers.')
    }
  }
}
