import { Env } from '@/config/env'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { AccountService } from '@/account/service'
import { WalletAddressService } from '@/walletAddress/service'
import { TransactionService } from '@/transaction/service'
import { RapydClient } from '@/rapyd/rapyd-client'
import { Logger } from 'winston'

export function createWalletAddressService(
  env: Env,
  rafikiClient: RafikiClient,
  accountService: AccountService,
  rapydClient: RapydClient,
  transactionService: TransactionService,
  logger: Logger
) {
  return new WalletAddressService(
    accountService,
    rafikiClient,
    env,
    transactionService,
    rapydClient,
    logger
  )
}
