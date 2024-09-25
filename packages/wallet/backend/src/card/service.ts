import { GateHubClient } from '../gatehub/client'
import {
  ICardDetailsRequest,
  ICardDetailsResponse,
  ICardResponse
} from './types'

export class CardService {
  constructor(private gateHubClient: GateHubClient) {}

  async getCardsByCustomer(customerId: string): Promise<ICardResponse[]> {
    return this.gateHubClient.getCardsByCustomer(customerId)
  }

  async getCardDetails(
    requestBody: ICardDetailsRequest
  ): Promise<ICardDetailsResponse> {
    return this.gateHubClient.getCardDetails(requestBody)
  }
}
