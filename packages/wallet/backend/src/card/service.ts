import { WalletAddressService } from '@/walletAddress/service'
import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLockRequest,
  ICardResponse,
  ICardUnlockRequest
} from './types'
import { LockReasonCode } from '@wallet/shared/src'
import { NotFound } from '@shared/backend'

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
    cardId: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    return this.gateHubClient.lockCard(cardId, reasonCode, requestBody)
  }

  async unlock(
    cardId: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    return this.gateHubClient.unlockCard(cardId, requestBody)
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
