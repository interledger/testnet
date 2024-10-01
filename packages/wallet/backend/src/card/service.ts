import { WalletAddressService } from '@/walletAddress/service'
import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardResponse,
  IGetTransactionsResponse
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
