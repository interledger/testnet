import {
  AccessToken,
  AuthenticatedClient,
  Grant,
  WalletAddress,
  isPendingGrant
} from '@interledger/open-payments'
import { Env } from '@/config/env'
import { Logger } from 'winston'
import { replaceHost } from '@/shared/utils'
import { InMemoryCache, InternalServerError } from '@shared/backend'

export class TokenCache extends InMemoryCache<string> {
  private walletAddress!: WalletAddress
  private manageUrl!: string

  constructor(
    private env: Env,
    private logger: Logger,
    private opClient: AuthenticatedClient
  ) {
    super()
  }

  async get(key: string): Promise<string> {
    const cached = this.cache.get(key)
    const now = Date.now()

    if (!cached) {
      this.walletAddress = await this.opClient.walletAddress.get({
        url: this.env.PAYMENT_POINTER
      })
      const grant = await this.getGrant()
      this.cacheToken({ access_token: grant.access_token })
      return grant.access_token.value
    }

    if (cached.expires !== null && cached.expires < now) {
      const rotatedToken = await this.rotateToken(cached.data)
      return rotatedToken.access_token.value
    }

    if (cached.expires !== null && cached.createdAt !== undefined) {
      const halfway = cached.createdAt + (cached.expires - cached.createdAt) / 2
      if (now >= halfway) {
        const rotatedToken = await this.rotateToken(cached.data)
        return rotatedToken.access_token.value
      }
    }

    return cached.data
  }

  private async rotateToken(token: string): Promise<AccessToken> {
    const refresh = await this.opClient.token.rotate({
      accessToken: token,
      url: this.manageUrl
    })
    this.cacheToken(refresh)
    return refresh
  }

  private cacheToken(token: AccessToken): void {
    this.set(
      'accessToken',
      token.access_token.value,
      token.access_token.expires_in
    )

    /**
     * If we change AUTH_SERVER_DOMAIN environment variable to
     * `http://rafiki-auth:3006` we would not be able to redirect
     * the user, because it will try navigate to
     * `http://rafiki-auth:3006/interact/...` which is only available
     * in the Docker container.
     */
    let manageUrl = token.access_token.manage
    if (this.env.NODE_ENV === 'development') {
      manageUrl = replaceHost(manageUrl, this.env.AUTH_CONTAINER)
    }
    this.manageUrl = manageUrl
  }

  private async getGrant(): Promise<Grant> {
    const grant = await this.opClient.grant.request(
      { url: this.walletAddress.authServer },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: 'interact' should be optional
      {
        access_token: {
          access: [
            {
              type: 'incoming-payment',
              actions: ['read-all', 'create']
            }
          ]
        }
      }
    )

    if (isPendingGrant(grant)) {
      this.logger.error('Expected non-interactive incoming payment grant.')
      throw new InternalServerError()
    }

    return grant
  }
}
