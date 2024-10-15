import { Account } from '@/account/model'
import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { RafikiClient } from '@/rafiki/rafiki-client'
import axios from 'axios'
import { getRandomValues } from 'crypto'
import { Cache, RedisClient } from '@shared/backend'
import { WalletAddress } from './model'
import { TransactionService } from '@/transaction/service'
import { Conflict, NotFound } from '@shared/backend'
import { WalletAddressOP } from '@wallet/shared'

export interface UpdateWalletAddressArgs {
  userId: string
  accountId: string
  walletAddressId: string
  publicName: string
}

export interface CreateWalletAddressArgs {
  userId: string
  accountId: string
  walletAddressName: string
  publicName: string
}

export type GetWalletAddressArgs = {
  walletAddressId: string
  accountId: string
  userId: string
}

export type WalletAddressList = {
  wmWalletAddresses: WalletAddress[]
  walletAddresses: WalletAddress[]
}

interface IWalletAddressService {
  create: (params: CreateWalletAddressArgs) => Promise<WalletAddress>
  update: (args: UpdateWalletAddressArgs) => Promise<void>
  list: (userId: string, accountId: string) => Promise<WalletAddress[]>
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
  walletAddress?: WalletAddress
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
    publicName
  })

  return newWalletAddress
}

export class WalletAddressService implements IWalletAddressService {
  private cache: Cache<WalletAddress>
  constructor(
    private accountService: AccountService,
    private rafikiClient: RafikiClient,
    private env: Env,
    redisClient: RedisClient,
    private transactionService: TransactionService
  ) {
    this.cache = new Cache<WalletAddress>(redisClient, 'WalletAddresses')
  }

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
      const assetId = account.assetId
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
        id: rafikiWalletAddress.id
      })

      await this.cache.set(walletAddress.id, walletAddress, {
        expiry: 60
      })
    }

    return walletAddress
  }

  async list(userId: string, accountId: string): Promise<WalletAddress[]> {
    const account = await this.accountService.findAccountById(accountId, userId)

    const walletAddressesResult = await WalletAddress.query()
      .where('accountId', account.id)
      .where('active', true)

    return walletAddressesResult
  }

  async listAll(userId: string): Promise<WalletAddress[]> {
    return WalletAddress.query()
      .where({ active: true })
      .joinRelated('account')
      .where({
        'account.userId': userId
      })
  }

  async getById(args: GetWalletAddressArgs): Promise<WalletAddress> {
    await this.accountService.findAccountById(args.accountId, args.userId)

    const walletAddress = await WalletAddress.query()
      .findById(args.walletAddressId)
      .where('active', true)
      .where('accountId', args.accountId)

    if (!walletAddress) {
      throw new NotFound()
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
    await this.transactionService.updateTransaction(
      { walletAddressId: walletAddress.id },
      { deletedAt: new Date() }
    )
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

      await this.cache.delete(walletAddressId)
      const updatedWalletAddress = await walletAddress
        .$query(trx)
        .findById(walletAddressId)
      updatedWalletAddress &&
        (await this.cache.set(walletAddressId, updatedWalletAddress, {
          expiry: 60
        }))

      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  public async getExternalWalletAddress(url: string): Promise<WalletAddressOP> {
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

    await this.cache.set(walletAddress.id, walletAddress, {
      expiry: 60
    })

    return walletAddress
  }
}
