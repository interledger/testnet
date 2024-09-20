import { GateHubClient } from '@/gatehub/client'
import { IFRAME_TYPE } from '@wallet/shared/src'
import { User } from '@/user/model'
import { NotFound } from '@shared/backend'
import { IWebhookDate } from '@/gatehub/types'
import { Logger } from 'winston'

export class GateHubService {
  constructor(
    private gateHubClient: GateHubClient,
    private logger: Logger
  ) {}

  async getIframeUrl(iframeType: IFRAME_TYPE, userId: string): Promise<string> {
    const user = await User.query().findById(userId)
    if (!user || !user.gateHubUserId) {
      throw new NotFound()
    }

    const url = await this.gateHubClient.getIframeUrl(
      iframeType,
      user.gateHubUserId
    )

    return url
  }

  async handleWebhook(data: IWebhookDate) {
    this.logger.debug(`GateHub webhook event received: ${JSON.stringify(data)}`)
    // TODO: handle other webhook types
    switch (data.event_type) {
      case 'id.verification.accepted':
        await this.markUserAsVerified(data.user_uuid)
        break
    }
  }

  private async markUserAsVerified(uuid: string): Promise<void> {
    const user = await User.query().findOne({ gateHubUserId: uuid })

    if (!user) {
      throw new NotFound('User not found')
    }

    await User.query().findById(user.id).patch({
      kycVerified: true
    })
  }
}
