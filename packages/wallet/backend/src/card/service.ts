import { GateHubClient } from '../gatehub/client'
import { ICardDetailsResponse, IMaskedCardDetailsResponse } from './types'

export class CardService {
  constructor(private gateHubClient: GateHubClient) {}

  async getMaskedCardDetails(
    cardId: string
  ): Promise<IMaskedCardDetailsResponse> {
    return this.gateHubClient.getMaskedCardDetails(cardId)
  }

  async getCardDetails(
    cardId: string,
    publicKeyBase64: string
  ): Promise<ICardDetailsResponse> {
    return this.gateHubClient.getCardDetails(cardId, publicKeyBase64)
  }
}
