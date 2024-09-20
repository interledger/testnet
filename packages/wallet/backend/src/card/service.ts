import { GateHubClient } from '../gatehub/client'
import { ICardDetailsResponse, IMaskedCardDetailsResponse } from './types'

export class CardService {
  constructor(private gateHubClient: GateHubClient) {}

  async getMaskedCardDetails(
    cardId: string
  ): Promise<IMaskedCardDetailsResponse> {
    return this.gateHubClient.getMaskedCardDetails(cardId)
  }

  async getCardDetails(cardId: string): Promise<ICardDetailsResponse> {
    const pk = '' // TODO
    return this.gateHubClient.getCardDetails(cardId, pk)
  }
}
