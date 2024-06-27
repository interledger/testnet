import { Account } from '@/account/model'
import { AccountService } from '@/account/service'
import { Env } from '@/config/env'
import { RafikiClient } from '@/rafiki/rafiki-client'
import axios from 'axios'
import { getRandomValues } from 'crypto'
import { WalletAddress } from './model'
import { PartialModelObject, TransactionOrKnex, raw } from 'objection'
import { RapydClient } from '@/rapyd/rapyd-client'
import { TransactionType } from '@/transaction/model'
import { Logger } from 'winston'
import { TransactionService } from '@/transaction/service'
import { Conflict, NotFound } from '@shared/backend'
import { WalletAddressOP } from '@wallet/shared'

interface HandleImbalanceParams {
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

export interface CreateWalletAddressArgs {
  userId: string
  accountId: string
  walletAddressName: string
  publicName: string
}

export type GetWalletAddressArgs = {
  walletAddressId: string
  accountId?: string
  userId?: string
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
    publicName
  })

  return newWalletAddress
}

export class WalletAddressService implements IWalletAddressService {
  constructor(
    private accountService: AccountService,
    private rafikiClient: RafikiClient,
    private env: Env,
    private transactionService: TransactionService,
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
        id: rafikiWalletAddress.id,
        assetCode: null,
        assetScale: this.env.MAX_ASSET_SCALE
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
    const walletAddress = await WalletAddress.query()
      .findById(id)
      .where('active', true)

    if (!walletAddress) {
      throw new NotFound()
    }

    return walletAddress
  }

  private async handleImbalance(
    { type, balance, walletAddress }: HandleImbalanceParams,
    trx: TransactionOrKnex
  ): Promise<void> {
    if (!walletAddress.assetCode || !walletAddress.assetScale) {
      throw new Error(
        `Missing asset information for payment pointer "${walletAddress.url} (ID: ${walletAddress.id})"`
      )
    }

    this.logger.debug(`Passed first throw`)

    // 10000000 is 0.01 i.e. one cent in asset scale 9
    // One cent is the lowest number that can be represented in asset scale 2 by Rapyd
    const rapydMinRepresentation = 10000000n
    const amount = Number(
      (
        Number(balance * rapydMinRepresentation) *
        10 ** -walletAddress.assetScale
      ).toPrecision(2)
    )

    if (!walletAddress.account.user.rapydWalletId) {
      throw new Error(
        `Missing Rapyd wallet ID for user "${walletAddress.account.user.id}"`
      )
    }

    this.logger.debug(`Passed second throw`)

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
        //TODO this might not be needed
        await walletAddress.$relatedQuery('account', trx).patch({
          debt: raw('?? + ?', ['debt', amount])
        })

        this.logger.debug(`Early return`)
        return
      }

      throw new Error(
        `Unable to transfer from ${source} into ${destination} error message: ${
          transfer.status?.message || 'unknown'
        }`
      )
    }

    this.logger.debug(`Passed third throw`)

    const updatedField: keyof Pick<
      PartialModelObject<WalletAddress>,
      'incomingBalance' | 'outgoingBalance'
    > = type === 'OUTGOING' ? 'outgoingBalance' : 'incomingBalance'
    const updatePart: PartialModelObject<WalletAddress> = {
      [updatedField]: raw('?? - ?', [
        updatedField,
        rapydMinRepresentation * balance
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
        description: 'Asset scale 9 imbalance'
      }),
      walletAddress.$query(trx).update(updatePart)
    ])

    //TODO remove this after testing
    this.logger.debug(
      `Proccesed asset scale 9 transactions for payment pointer ${walletAddress.url}. Type: ${type} | Amount: ${amount}`
    )
  }

  async keepBalancesSynced(lastProcessedTimestamp: Date): Promise<void> {
    const trx = await WalletAddress.startTransaction()

    try {
      const walletAddresses = await WalletAddress.query(trx)
        .where({
          active: true
        })
        .withGraphFetched('account.user')

      for (const walletAddress of walletAddresses) {
        if (!walletAddress.assetCode || !walletAddress.assetScale) {
          throw new Error('Asset code or scale is missing')
        }

        const [incoming, outgoing] = await Promise.all([
          this.transactionService.sumByWalletAddressIdSince(
            walletAddress.id,
            'INCOMING',
            lastProcessedTimestamp,
            trx
          ),
          this.transactionService.sumByWalletAddressIdSince(
            walletAddress.id,
            'OUTGOING',
            lastProcessedTimestamp,
            trx
          )
        ])

        const tmpWalletAddress = await walletAddress
          .$query(trx)
          .updateAndFetchById(walletAddress.id, {
            incomingBalance: raw('?? + ?', ['incomingBalance', incoming.sum]),
            outgoingBalance: raw('?? + ?', ['outgoingBalance', outgoing.sum])
          })

        // 10000000 is 0.01 i.e. one cent in asset scale 9
        // One cent is the lowest number that can be represented in asset scale 2 by Rapyd
        const rapydMinRepresentation = 10000000n

        const incomingBalance =
          tmpWalletAddress.incomingBalance / rapydMinRepresentation
        const outgoingBalance =
          tmpWalletAddress.outgoingBalance / rapydMinRepresentation

        this.logger.debug(
          `Incoming balance: ${incomingBalance}. Outgoing balance: ${outgoingBalance}`
        )

        if (incomingBalance > 0n) {
          await this.handleImbalance(
            {
              balance: incomingBalance,
              walletAddress,
              type: 'INCOMING'
            },
            trx
          )
        }

        if (outgoingBalance > 0n) {
          await this.handleImbalance(
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
      throw new Error('Error while processing payment pointers.')
    }
  }
}
