import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLimitRequest,
  ICardLimitResponse,
  ICardLockRequest,
  ICardUnlockRequest
} from './types'
import { IGetTransactionsResponse } from '@wallet/shared/src'
import { LockReasonCode } from '@wallet/shared/src'
import { InternalServerError, NotFound } from '@shared/backend'
import { BlockReasonCode } from '@wallet/shared/src'
import { AccountService } from '@/account/service'
import { ICardResponse } from '@wallet/shared'
import { UserService } from '@/user/service'
import { Logger } from 'winston'

export class CardService {
  constructor(
    private gateHubClient: GateHubClient,
    private accountService: AccountService,
    private userService: UserService,
    private logger: Logger
  ) {}

  async getCardsByCustomer(
    userId: string,
    customerId: string
  ): Promise<ICardResponse[]> {
    const gateHubUserId = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.getCardsByCustomer(customerId, gateHubUserId)
  }

  async getCardDetails(
    userId: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureAccountExists(userId, cardId)

    const gateHubUserId = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.getCardDetails(gateHubUserId, requestBody)
  }

  async getCardTransactions(
    userId: string,
    cardId: string,
    pageSize?: number,
    pageNumber?: number
  ): Promise<IGetTransactionsResponse> {
    await this.ensureAccountExists(userId, cardId)

    return this.gateHubClient.getCardTransactions(cardId, pageSize, pageNumber)
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
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureAccountExists(userId, cardId)
    const gateHubUserId = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.getPin(gateHubUserId, requestBody)
  }

  async getTokenForPinChange(userId: string, cardId: string): Promise<string> {
    await this.ensureAccountExists(userId, cardId)

    const gateHubUserId = await this.ensureGatehubUserUuid(userId)
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
    await this.ensureAccountExists(userId, cardId)

    await this.gateHubClient.changePin(token, cypher)
  }

  async lock(
    userId: string,
    cardId: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    await this.ensureAccountExists(userId, cardId)

    const gateHubUserId = await this.ensureGatehubUserUuid(userId)

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

    const gateHubUserId = await this.ensureGatehubUserUuid(userId)

    return this.gateHubClient.unlockCard(cardId, gateHubUserId, requestBody)
  }

  async permanentlyBlockCard(
    userId: string,
    cardId: string,
    reasonCode: BlockReasonCode
  ): Promise<ICardResponse> {
    await this.ensureAccountExists(userId, cardId)

    return this.gateHubClient.permanentlyBlockCard(cardId, reasonCode)
  }

  private async ensureAccountExists(
    userId: string,
    cardId: string
  ): Promise<void> {
    const account = await this.accountService.getAccountByCardId(userId, cardId)
    if (!account) {
      throw new NotFound('Card not found or not associated with the user.')
    }
  }

  private async ensureGatehubUserUuid(userId: string): Promise<string> {
    const user = await this.userService.getById(userId)

    if (!user) {
      this.logger.error(`Could not find user with id: ${userId}`)
      throw new InternalServerError()
    }

    if (!user.gateHubUserId) {
      this.logger.error(`User ${user.id} does not have a GateHub ID.`)
      throw new InternalServerError()
    }

    return user.gateHubUserId
  }
}
