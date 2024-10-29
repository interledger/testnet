import { Account } from './model'
import { User } from '@/user/model'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'
import { Amount } from '@/rafiki/service'
import { Conflict, NotFound } from '@shared/backend'
import { DEFAULT_ASSET_SCALE } from '@/utils/consts'
import { GateHubClient } from '@/gatehub/client'
import { v4 as uuid } from 'uuid'
import { MANUAL_NETWORK, TransactionTypeEnum } from '@/gatehub/consts'

type CreateAccountArgs = {
  userId: string
  name: string
  assetId: string
  isDefaultCardsAccount?: boolean
  cardId?: string
}

interface IAccountService {
  createDefaultAccount: (userId: string) => Promise<Account | undefined>
  createAccount: (args: CreateAccountArgs) => Promise<Account>
  getAccounts: (
    userId: string,
    includeWalletAddress?: boolean,
    includeWalletKeys?: boolean
  ) => Promise<Account[]>
  getAccountById: (userId: string, accountId: string) => Promise<Account>
  getAccountBalance: (account: Account) => Promise<number>
  fundAccount: (
    userId: string,
    accountId: string,
    amount: number
  ) => Promise<void>
}

export class AccountService implements IAccountService {
  constructor(
    private gateHubClient: GateHubClient,
    private rafikiClient: RafikiClient
  ) {}

  public async createAccount(args: CreateAccountArgs): Promise<Account> {
    const existingAccount = await Account.query()
      .where('userId', args.userId)
      .where('name', args.name)
      .first()
    if (existingAccount) {
      throw new Conflict(
        `An account with the name '${args.name}' already exists`
      )
    }
    const asset = await this.rafikiClient.getAssetById(args.assetId)

    if (!asset) {
      throw new NotFound()
    }

    const existingAssetAccount = await Account.query()
      .where('assetCode', asset.code)
      .where('userId', args.userId)
      .first()
    if (existingAssetAccount) {
      throw new Conflict(
        `You can only have one account per asset. ${asset.code} account already exists`
      )
    }

    // issue virtual account to wallet
    const user = await User.query().findById(args.userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    // If user has a card then it already has a GateHub wallet
    // Therefore, we just need to fetch the wallet and create an associated account for it
    let gateHubWalletId
    if (args.isDefaultCardsAccount) {
      const result = await this.gateHubClient.getWalletForUser(
        user.gateHubUserId
      )
      gateHubWalletId = result.wallets[0].address
    } else {
      const result = await this.gateHubClient.createWallet(
        user.gateHubUserId,
        args.name
      )
      gateHubWalletId = result.address
    }

    const account = await Account.query().insert({
      name: args.name,
      userId: args.userId,
      assetCode: asset.code,
      assetId: args.assetId,
      assetScale: asset.scale,
      gateHubWalletId,
      cardId: args.cardId
    })

    // On creation account will have balance 0
    account.balance = transformBalance(0, account.assetScale)

    return account
  }

  public async getAccounts(
    userId: string,
    includeWalletAddress?: boolean,
    includeWalletKeys?: boolean
  ): Promise<Account[]> {
    const user = await User.query().findById(userId)

    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    let query = Account.query().where('userId', userId)
    if (includeWalletAddress) {
      const includeModels = includeWalletKeys
        ? 'walletAddresses.[keys]'
        : 'walletAddresses'
      query = query
        .withGraphFetched(includeModels)
        .modifyGraph('walletAddresses', (builder) => {
          builder.where({ active: true }).orderBy('createdAt', 'ASC')
        })
    }

    const accounts = await query

    if (!includeWalletAddress) {
      await Promise.all(
        accounts.map(async (acc) => {
          const balance = await this.getAccountBalance(acc)
          acc.balance = transformBalance(balance, acc.assetScale)
        })
      )
    }

    return accounts
  }

  public async getAccountByAssetCode(
    userId: string,
    amount: Amount
  ): Promise<Account> {
    const account = await Account.query()
      .where('userId', userId)
      .where('assetCode', amount.assetCode)
      .first()

    if (!account) {
      throw new NotFound()
    }

    account.balance = transformBalance(
      await this.getAccountBalance(account),
      account.assetScale
    )

    return account
  }

  public async getAccountById(
    userId: string,
    accountId: string
  ): Promise<Account> {
    const account = await this.findAccountById(accountId, userId)

    account.balance = transformBalance(
      await this.getAccountBalance(account),
      account.assetScale
    )

    return account
  }

  async getAccountByCardId(userId: string, cardId: string): Promise<Account> {
    const account = await Account.query()
      .where('userId', userId)
      .where('cardId', cardId)
      .first()

    if (!account) {
      throw new NotFound()
    }

    account.balance = transformBalance(
      await this.getAccountBalance(account),
      account.assetScale
    )

    return account
  }

  async getAccountBalance(account: Account): Promise<number> {
    const user = await User.query()
      .findById(account.userId)
      .select('gateHubUserId')

    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const balances = await this.gateHubClient.getWalletBalance(
      account.gateHubWalletId,
      user.gateHubUserId
    )

    return Number(
      balances.find((balance) => balance.vault.asset_code === account.assetCode)
        ?.available ?? 0
    )
  }

  public findAccountById = async (
    accountId: string,
    userId: string
  ): Promise<Account> => {
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)

    if (!account) {
      throw new NotFound()
    }

    return account
  }

  public async createDefaultAccount(
    userId: string,
    name = 'USD Account',
    isDefaultCardsAccount = false,
    cardId?: string
  ): Promise<Account | undefined> {
    const asset = (await this.rafikiClient.listAssets({ first: 100 })).find(
      (asset) => asset.code === 'EUR' && asset.scale === DEFAULT_ASSET_SCALE
    )
    if (!asset) {
      return
    }
    const account = await this.createAccount({
      name,
      userId,
      assetId: asset.id,
      isDefaultCardsAccount,
      cardId
    })

    return account
  }

  async fundAccount(userId: string, accountId: string, amount: number) {
    const account = await this.findAccountById(accountId, userId)

    await this.gateHubClient.createTransaction({
      amount,
      network: MANUAL_NETWORK,
      uid: uuid(),
      receiving_address: account.gateHubWalletId,
      vault_uuid: this.gateHubClient.getVaultUuid(account.assetCode),
      type: TransactionTypeEnum.DEPOSIT,
      absolute_fee: 0
    })
  }
}
