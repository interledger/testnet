import { GateHubClient } from '../gatehub/client'
import {
  CloseCardReason,
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLimitRequest,
  ICardLimitResponse,
  ICardLockRequest,
  ICardUnlockRequest
} from './types'
import { IGetTransactionsResponse } from '@wallet/shared/src'
import { LockReasonCode } from '@wallet/shared/src'
import { BadRequest, InternalServerError, NotFound } from '@shared/backend'
import { AccountService } from '@/account/service'
import { ICardResponse } from '@wallet/shared'
import { UserService } from '@/user/service'
import { Logger } from 'winston'
import { User } from '@/user/model'
import { Account } from '@/account/model'
import { TransactionTypeEnum } from '@/gatehub/consts'
import { Env } from '@/config/env'

export class CardService {
  constructor(
    private gateHubClient: GateHubClient,
    private accountService: AccountService,
    private userService: UserService,
    private logger: Logger,
    private env: Env
  ) {}

  async getCardsByCustomer(
    userId: string,
    customerId: string
  ): Promise<ICardResponse[]> {
    const user = await User.query().findById(userId)
    if (!user) {
      throw new NotFound()
    }
    const { gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    const cards = await this.gateHubClient.getCardsByCustomer(
      customerId,
      gateHubUserId
    )

    const activeCard =
      cards.find((card) => card.status !== 'SoftDelete') || cards[0]

    Object.assign(activeCard, {
      isPinSet: user.isPinSet,
      walletAddress: user.cardWalletAddress
    })

    return [activeCard]
  }

  async getCardDetails(
    userId: string,
    password: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureAccountExists(userId, cardId)

    const { user, gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    const isValidPassword = await user.verifyPassword(password)
    if (!isValidPassword) {
      throw new BadRequest('Password is not valid')
    }

    return await this.gateHubClient.getCardDetails(gateHubUserId, requestBody)
  }

  async getCardTransactions(
    userId: string,
    cardId: string,
    pageSize?: number,
    pageNumber?: number
  ): Promise<IGetTransactionsResponse> {
    await this.ensureAccountExists(userId, cardId)
    const { gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.getCardTransactions(
      cardId,
      gateHubUserId,
      pageSize,
      pageNumber
    )
  }

  async getCardLimits(
    userId: string,
    cardId: string
  ): Promise<ICardLimitResponse[]> {
    await this.ensureAccountExists(userId, cardId)

    return this.gateHubClient.getCardLimits(cardId)
  }

  async createOrOverrideCardLimits(
    userId: string,
    cardId: string,
    requestBody: ICardLimitRequest[]
  ): Promise<ICardLimitResponse[]> {
    await this.ensureAccountExists(userId, cardId)

    return this.gateHubClient.createOrOverrideCardLimits(cardId, requestBody)
  }

  async getPin(
    userId: string,
    password: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureAccountExists(userId, cardId)
    const { user, gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    const isValidPassword = await user.verifyPassword(password)
    if (!isValidPassword) {
      throw new BadRequest('Password is not valid')
    }

    return this.gateHubClient.getPin(gateHubUserId, requestBody)
  }

  async getTokenForPinChange(userId: string, cardId: string): Promise<string> {
    await this.ensureAccountExists(userId, cardId)

    const { gateHubUserId } = await this.ensureGatehubUserUuid(userId)
    const token = await this.gateHubClient.getTokenForPinChange(
      gateHubUserId,
      cardId
    )

    return token
  }

  async changePin(
    userId: string,
    cardId: string,
    token: string,
    cypher: string
  ): Promise<void> {
    const cardAccount = await this.ensureAccountExists(userId, cardId)

    await this.gateHubClient.changePin(token, cypher)

    await User.query().findById(userId).patch({ isPinSet: true })

    await this.fundAccount(cardAccount)
  }

  async lock(
    userId: string,
    cardId: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    await this.ensureAccountExists(userId, cardId)

    const { gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.lockCard(
      cardId,
      gateHubUserId,
      reasonCode,
      requestBody
    )
  }

  async unlock(
    userId: string,
    cardId: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    await this.ensureAccountExists(userId, cardId)

    const { gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.unlockCard(cardId, gateHubUserId, requestBody)
  }

  async closeCard(
    userId: string,
    cardId: string,
    reasonCode: CloseCardReason
  ): Promise<void> {
    await this.ensureAccountExists(userId, cardId)

    const { gateHubUserId } = await this.ensureGatehubUserUuid(userId)

    await this.gateHubClient.closeCard(gateHubUserId, cardId, reasonCode)
  }

  private async ensureAccountExists(
    userId: string,
    cardId: string
  ): Promise<Account> {
    const account = await this.accountService.getAccountByCardId(userId, cardId)
    if (!account) {
      throw new NotFound('Card not found or not associated with the user.')
    }

    return account
  }

  private async ensureGatehubUserUuid(
    userId: string
  ): Promise<{ user: User; gateHubUserId: string }> {
    const user = await this.userService.getById(userId)

    if (!user) {
      this.logger.error(`Could not find user with id: ${userId}`)
      throw new InternalServerError()
    }

    if (!user.gateHubUserId) {
      this.logger.error(`User ${user.id} does not have a GateHub ID.`)
      throw new InternalServerError()
    }

    return { user, gateHubUserId: user.gateHubUserId }
  }

  private async fundAccount(cardAccount: Account) {
    if (cardAccount.isFunded) {
      this.logger.warn(`Account was already funded ${cardAccount.id}`)
      return
    }

    await Account.query().findById(cardAccount.id).patch({ isFunded: true })

    await this.gateHubClient.createTransaction({
      amount: 20,
      vault_uuid: this.gateHubClient.getVaultUuid(cardAccount.assetCode),
      receiving_address: cardAccount.gateHubWalletId,
      sending_address: this.env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
      type: TransactionTypeEnum.HOSTED,
      message: 'Transfer'
    })
  }
}
