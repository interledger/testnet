import type { Env } from '@/config/env'
import { createAtallaServerConfig } from '@/hsm/atalla/config'
import {
  createAtallaIssuerServer,
  type IssuerServer
} from '@interledger/hsm-atalla-issuer'
import {
  createAtallaMerchantServer,
  type MerchantServer
} from '@interledger/hsm-atalla-merchant'
import type { Logger } from 'winston'

export class HsmAtallaService {
  private issuer: IssuerServer | undefined
  private merchant: MerchantServer | undefined
  private started = false

  constructor(
    private env: Env,
    private logger: Logger
  ) {}

  async start(): Promise<void> {
    if (!this.env.HSM_ENABLED) {
      this.logger.info('Atalla HSM gRPC servers are disabled')
      return
    }

    if (this.started) return

    const config = createAtallaServerConfig(this.env)

    if (config.role === 'both' || config.role === 'issuer') {
      this.issuer = createAtallaIssuerServer(config.issuer)
    }
    if (config.role === 'both' || config.role === 'merchant') {
      this.merchant = createAtallaMerchantServer(config.merchant)
    }

    try {
      const startResults = await Promise.allSettled([
        this.issuer?.start() ?? Promise.resolve(),
        this.merchant?.start() ?? Promise.resolve()
      ])
      this.throwIfRejected(startResults, 'Unable to start Atalla gRPC servers')

      const healthResults = await Promise.allSettled([
        this.issuer?.healthCheck() ?? Promise.resolve(undefined),
        this.merchant?.healthCheck() ?? Promise.resolve(undefined)
      ])
      this.throwIfRejected(
        healthResults,
        'Unable to check Atalla gRPC server health'
      )

      const [issuerHealth, merchantHealth] = healthResults.map((result) =>
        result.status === 'fulfilled' ? result.value : undefined
      )
      if (issuerHealth && !issuerHealth.healthy) {
        throw new Error('Atalla issuer HSM health check failed')
      }
      if (merchantHealth && !merchantHealth.healthy) {
        throw new Error('Atalla merchant HSM health check failed')
      }

      this.started = true

      if (issuerHealth) {
        this.logger.info('Atalla issuer gRPC server started', {
          endpoint: this.endpoint(
            config.issuer.grpc.host,
            config.issuer.grpc.port
          )
        })
      }

      if (merchantHealth) {
        this.logger.info('Atalla merchant gRPC server started', {
          endpoint: this.endpoint(
            config.merchant.grpc.host,
            config.merchant.grpc.port
          )
        })
      }
    } catch (error) {
      const cleanupErrors = await this.stopServers()
      for (const cleanupError of cleanupErrors) {
        this.logger.error('Unable to clean up an Atalla gRPC server', {
          error: cleanupError
        })
      }
      throw error
    }
  }

  async stop(): Promise<void> {
    const errors = await this.stopServers()
    if (errors.length) {
      throw new AggregateError(errors, 'Unable to stop Atalla gRPC servers')
    }
  }

  private endpoint(host: string | undefined, port: number): string {
    return `${host ?? '0.0.0.0'}:${port}`
  }

  private async stopServers(): Promise<unknown[]> {
    const issuer = this.issuer
    const merchant = this.merchant
    const [issuerResult, merchantResult] = await Promise.allSettled([
      issuer?.stop() ?? Promise.resolve(),
      merchant?.stop() ?? Promise.resolve()
    ])

    if (issuerResult.status === 'fulfilled') this.issuer = undefined
    if (merchantResult.status === 'fulfilled') this.merchant = undefined
    this.started = this.issuer !== undefined || this.merchant !== undefined

    return [issuerResult, merchantResult].flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : []
    )
  }

  private throwIfRejected(
    results: PromiseSettledResult<unknown>[],
    message: string
  ): void {
    const errors = results.flatMap((result) =>
      result.status === 'rejected' ? [result.reason] : []
    )
    if (errors.length) throw new AggregateError(errors, message)
  }
}
