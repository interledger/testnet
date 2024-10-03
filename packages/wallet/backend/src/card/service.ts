import { WalletAddressService } from '@/walletAddress/service'
import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLockRequest,
  ICardResponse,
  ICardUnlockRequest
} from './types'
import { IGetTransactionsResponse } from '@wallet/shared/src'
import { LockReasonCode } from '@wallet/shared/src'
import { NotFound } from '@shared/backend'
import { BlockReasonCode } from '@wallet/shared/src'

export class CardService {
  constructor(
    private gateHubClient: GateHubClient,
    private walletAddressService: WalletAddressService
  ) {}

  async getCardsByCustomer(customerId: string): Promise<ICardResponse[]> {
    return this.gateHubClient.getCardsByCustomer(customerId)
  }

  async getCardDetails(
    userId: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureWalletAddressExists(userId, cardId)

    return this.gateHubClient.getCardDetails(requestBody)
  }

  async getCardTransactions(
    userId: string,
    cardId: string,
    pageSize?: number,
    pageNumber?: number
  ): Promise<IGetTransactionsResponse> {
    await this.ensureWalletAddressExists(userId, cardId)

    return this.gateHubClient.getCardTransactions(cardId, pageSize, pageNumber)
  }

  async getPin(
    userId: string,
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    const { cardId } = requestBody
    await this.ensureWalletAddressExists(userId, cardId)

    return this.gateHubClient.getPin(requestBody)
  }

  async changePin(
    userId: string,
    cardId: string,
    cypher: string
  ): Promise<void> {
    await this.ensureWalletAddressExists(userId, cardId)

    await this.gateHubClient.changePin(cardId, cypher)
  }

  async lock(
    userId: string,
    cardId: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    await this.ensureWalletAddressExists(userId, cardId)

    return this.gateHubClient.lockCard(cardId, reasonCode, requestBody)
  }

  async unlock(
    userId: string,
    cardId: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    await this.ensureWalletAddressExists(userId, cardId)

    return this.gateHubClient.unlockCard(cardId, requestBody)
  }

  async permanentlyBlockCard(
    userId: string,
    cardId: string,
    reasonCode: BlockReasonCode
  ): Promise<ICardResponse> {
    await this.ensureWalletAddressExists(userId, cardId)

    return this.gateHubClient.permanentlyBlockCard(cardId, reasonCode)
  }

  private async ensureWalletAddressExists(
    userId: string,
    cardId: string
  ): Promise<void> {
    const walletAddress = await this.walletAddressService.getByCardId(
      userId,
      cardId
    )
    if (!walletAddress) {
      throw new NotFound('Card not found or not associated with the user.')
    }
  }
}
