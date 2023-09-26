import { Grant } from '@/rafiki/auth/generated/graphql'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { Forbidden } from '@/errors'
import { PaymentPointerService } from '@/paymentPointer/service'

interface IGrantService {
  getGrantByInteraction: (
    userId: string,
    interactionId: string,
    nonce: string
  ) => Promise<Grant>
  setInteractionResponse: (
    userId: string,
    interactionId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ) => Promise<Grant>
}

interface GrantServiceDependencies {
  rafikiAuthService: RafikiAuthService
  paymentPointerService: PaymentPointerService
}

export class GrantService implements IGrantService {
  constructor(private deps: GrantServiceDependencies) {}

  async getGrantByInteraction(
    userId: string,
    interactionId: string,
    nonce: string
  ): Promise<Grant> {
    const grant: Grant =
      await this.deps.rafikiAuthService.getGrantByInteraction(
        interactionId,
        nonce
      )

    const url = grant.access.find(({ identifier }) => identifier)?.identifier

    if (
      !url ||
      !(await this.deps.paymentPointerService.belongsToUser(userId, url))
    ) {
      throw new Forbidden('NO_ACCESS')
    }

    return grant
  }

  async setInteractionResponse(
    userId: string,
    interactionId: string,
    nonce: string,
    response: 'accept' | 'reject'
  ): Promise<Grant> {
    await this.getGrantByInteraction(userId, interactionId, nonce)

    return await this.deps.rafikiAuthService.setInteractionResponse(
      interactionId,
      nonce,
      response
    )
  }
}
