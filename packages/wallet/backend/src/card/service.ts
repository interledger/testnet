import { GateHubClient } from '../gatehub/client'

export class CardService {
  constructor(private gateHubClient: GateHubClient) {}

  async getCardDetails(cardId: string) {
    return this.gateHubClient.getCardDetails(cardId)
  }
}
