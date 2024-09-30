import { Account } from './model'
import { User } from '@/user/model'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { transformBalance } from '@/utils/helpers'
import { Amount } from '@/rafiki/service'
import { Conflict, NotFound } from '@shared/backend'
import { DEFAULT_ASSET_SCALE } from '@/utils/consts'
import { GateHubClient } from '@/gatehub/client'

type CreateAccountArgs = {
  userId: string
  name: string
  assetId: string
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

    const result = await this.gateHubClient.createWallet(
      user.gateHubUserId,
      args.name
    )

    const account = await Account.query().insert({
      name: args.name,
      userId: args.userId,
      assetCode: asset.code,
      assetId: args.assetId,
      assetScale: asset.scale,
      gateHubWalletId: result.address
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
    const account = await Account.query()
      .findById(accountId)
      .where('userId', userId)

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
    const balances = await this.gateHubClient.getWalletBalance(
      account.gateHubWalletId
    )
    return Number(
      balances.find((balance) => balance.vault.asset_code === account.assetCode)
        ?.total ?? 0
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
    name = 'USD Account'
  ): Promise<Account | undefined> {
    const asset = (await this.rafikiClient.listAssets({ first: 100 })).find(
      (asset) => asset.code === 'USD' && asset.scale === DEFAULT_ASSET_SCALE
    )
    if (!asset) {
      return
    }
    const account = await this.createAccount({
      name,
      userId,
      assetId: asset.id
    })

    return account
  }
}
