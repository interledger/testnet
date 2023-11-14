import { Env } from '@/config/env'
import { Knex } from 'knex'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { AccountService } from '@/account/service'
import { RapydClient } from '@/rapyd/rapyd-client'
import type { Logger } from 'winston'
import { WalletAddressService } from '@/walletAddress/service'
import { Cache } from '@/cache/service'
import { WalletAddress } from '@/walletAddress/model'
import { WMTransactionService } from '@/webMonetization/transaction/service'
import { RedisClient } from '@/cache/redis-client'

export function createWalletAddressService(
  env: Env,
  knex: Knex,
  rafikiClient: RafikiClient,
  accountService: AccountService,
  rapydClient: RapydClient,
  wMTransactionService: WMTransactionService,
  redisClient: RedisClient,
  logger: Logger
) {
  return new WalletAddressService({
    env,
    knex,
    rafikiClient,
    accountService,
    cache: new Cache<WalletAddress>(redisClient, 'WMWalletAddresses'),
    wmTransactionService: wMTransactionService,
    rapydClient,
    logger
  })
}
