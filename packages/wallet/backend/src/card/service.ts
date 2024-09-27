import { WalletAddressService } from '@/walletAddress/service'
import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardLockRequest,
  ICardResponse,
  ICardUnlockRequest,
  LockReasonCode
} from './types'
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

    const walletAddress = await this.walletAddressService.getByCardId(
      userId,
      cardId
    )
    if (!walletAddress) {
      throw new NotFound('Card not found or not associated with the user.')
    }

    return this.gateHubClient.getCardDetails(requestBody)
  }

  async lockCard(
    cardId: string,
    reasonCode: LockReasonCode,
    requestBody: ICardLockRequest
  ): Promise<ICardResponse> {
    return this.gateHubClient.lockCard(cardId, reasonCode, requestBody)
  }

  async unlockCard(
    cardId: string,
    requestBody: ICardUnlockRequest
  ): Promise<ICardResponse> {
    return this.gateHubClient.unlockCard(cardId, requestBody)
  }
}
