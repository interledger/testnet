import { GateHubClient } from '@/gatehub/client'
import { IFRAME_TYPE } from '@wallet/shared/src'
import { User } from '@/user/model'
import { NotFound } from '@shared/backend'

export class GateHubService {
  constructor(private gateHubClient: GateHubClient) {}

  async getIframeUrl(iframeType: IFRAME_TYPE, userId: string): Promise<string> {
    const user = await User.query().findById(userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const url = await this.gateHubClient.getIframeUrl(iframeType, user.gateHubUserId)

    return url
  }
}
