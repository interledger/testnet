import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLimitRequest,
  ICardLimitResponse,
  ICardLockRequest,
  ICardResponse,
  ICardUnlockRequest
} from './types'
import { IGetTransactionsResponse } from '@wallet/shared/src'
import { LockReasonCode } from '@wallet/shared/src'
import { NotFound } from '@shared/backend'
import { BlockReasonCode } from '@wallet/shared/src'
import { AccountService } from '@/account/service'

export class CardService {
  constructor(
    private gateHubClient: GateHubClient,
    private accountService: AccountService
  ) {}

  async getCardsByCustomer(customerId: string): Promise<ICardResponse[]> {
    return this.gateHubClient.getCardsByCustomer(customerId)
  }

  async getCardDetails(
    userId: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureAccountExists(userId, cardId)

    return this.gateHubClient.getCardDetails(requestBody)
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

    return this.gateHubClient.getPin(requestBody)
  }

  async getTokenForPinChange(userId: string, cardId: string): Promise<string> {
    await this.ensureWalletAddressExists(userId, cardId)

    const token = await this.gateHubClient.getTokenForPinChange(cardId)

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

    return this.gateHubClient.lockCard(cardId, reasonCode, requestBody)
  }

  async unlock(
    userId: string,
    cardId: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    await this.ensureAccountExists(userId, cardId)

    return this.gateHubClient.unlockCard(cardId, requestBody)
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
}
