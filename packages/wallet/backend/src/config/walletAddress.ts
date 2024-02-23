import { Env } from '@/config/env'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { AccountService } from '@/account/service'
import { RapydClient } from '@/rapyd/rapyd-client'
import type { Logger } from 'winston'
import { WalletAddressService } from '@/walletAddress/service'
import { Cache } from '@/cache/service'
import { WalletAddress } from '@/walletAddress/model'
import { WMTransactionService } from '@/webMonetization/transaction/service'
import { RedisClient } from '@/cache/redis-client'
import { TransactionService } from '@/transaction/service'

export function createWalletAddressService(
  env: Env,
  rafikiClient: RafikiClient,
  accountService: AccountService,
  rapydClient: RapydClient,
  wmTransactionService: WMTransactionService,
  transactionService: TransactionService,
  redisClient: RedisClient,
  logger: Logger
) {
  return new WalletAddressService(
    accountService,
    rafikiClient,
    env,
    new Cache<WalletAddress>(redisClient, 'WMWalletAddresses'),
    wmTransactionService,
    transactionService,
    rapydClient,
    logger
  )
}
