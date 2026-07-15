import {
  createAuthenticatedClient,
  isPendingGrant,
  type AuthenticatedClient,
  type Grant,
  type GrantContinuation,
  type IncomingPayment,
  type OutgoingPayment,
  type PendingGrant,
  type Quote,
  type WalletAddress
} from '@interledger/open-payments'
import type { Amount, ClientConfig } from '@/types'

/** A pending interactive grant reduced to what the runner needs. */
export interface PendingGrantHandle {
  /** The consent URL the resource owner must open to approve. */
  redirect: string
  continueUri: string
  continueToken: string
  /** Seconds the client must wait before continuing (GNAP `wait`). */
  wait: number
}

/** A continued (approved) grant reduced to a reusable token bundle. */
export interface ApprovedGrant {
  accessToken: string
  manageUrl?: string
}

/**
 * A thin, benchmark-focused wrapper over the Open Payments client. Every method
 * is a single network operation, which keeps the runner's logic (retries,
 * concurrency, metrics) free of transport details and easy to unit test against
 * a mock client.
 */
export class BenchmarkClient {
  constructor(private readonly client: AuthenticatedClient) {}

  /** Build an authenticated client from the benchmark's developer key. */
  static async create(config: ClientConfig): Promise<BenchmarkClient> {
    const client = await createAuthenticatedClient({
      walletAddressUrl: config.walletAddressUrl,
      keyId: config.keyId,
      privateKey: config.privateKey,
      // Local ASE responses can lag the published OpenAPI spec; skip strict
      // response validation so the benchmark focuses on throughput, not schema.
      validateResponses: false
    })
    return new BenchmarkClient(client)
  }

  getWalletAddress(url: string): Promise<WalletAddress> {
    return this.client.walletAddress.get({ url })
  }

  /** Request a non-interactive grant and return its access token value. */
  async nonInteractiveToken(
    authServer: string,
    type: string,
    actions: string[]
  ): Promise<string> {
    const grant = await this.client.grant.request(
      { url: authServer },
      // `interact` is optional for non-interactive grants but the generated
      // type marks it required; the API accepts its absence.
      { access_token: { access: [{ type, actions }] } } as never
    )
    if (isPendingGrant(grant) || !grant.access_token) {
      throw new Error(`Expected a non-interactive ${type} grant.`)
    }
    return grant.access_token.value
  }

  createIncomingPayment(args: {
    receiver: WalletAddress
    incomingAmount: Amount
    accessToken: string
    expiresAt?: string
    description?: string
  }): Promise<IncomingPayment> {
    return this.client.incomingPayment.create(
      { url: args.receiver.resourceServer, accessToken: args.accessToken },
      {
        walletAddress: args.receiver.id,
        incomingAmount: args.incomingAmount,
        expiresAt: args.expiresAt,
        metadata: { description: args.description ?? 'benchmark' }
      }
    )
  }

  getIncomingPayment(
    url: string,
    accessToken: string
  ): Promise<IncomingPayment> {
    return this.client.incomingPayment.get({ url, accessToken })
  }

  createQuote(args: {
    payer: WalletAddress
    receiver: string
    receiveAmount: Amount
    accessToken: string
  }): Promise<Quote> {
    return this.client.quote.create(
      { url: args.payer.resourceServer, accessToken: args.accessToken },
      {
        method: 'ilp',
        walletAddress: args.payer.id,
        receiver: args.receiver,
        receiveAmount: args.receiveAmount
      }
    )
  }

  /**
   * Create an outgoing payment either from a pre-computed quote (`quoteId`) or,
   * when quoting is skipped, directly from the incoming payment with a fixed
   * `debitAmount` (Open Payments lets a payment be created from an incoming
   * payment + debit without a client-visible quote).
   */
  createOutgoingPayment(
    args: {
      payer: WalletAddress
      accessToken: string
      description?: string
    } & (
      | { quoteId: string }
      | { incomingPayment: string; debitAmount: Amount }
    )
  ): Promise<OutgoingPayment> {
    const metadata = { description: args.description ?? 'benchmark slice' }
    const body =
      'quoteId' in args
        ? { walletAddress: args.payer.id, quoteId: args.quoteId, metadata }
        : {
            walletAddress: args.payer.id,
            incomingPayment: args.incomingPayment,
            debitAmount: args.debitAmount,
            metadata
          }
    return this.client.outgoingPayment.create(
      { url: args.payer.resourceServer, accessToken: args.accessToken },
      body
    )
  }

  /** Fetch an outgoing payment, e.g. to poll it toward full settlement. */
  getOutgoingPayment(
    url: string,
    accessToken: string
  ): Promise<OutgoingPayment> {
    return this.client.outgoingPayment.get({ url, accessToken })
  }

  /**
   * Request an interactive outgoing-payment grant WITHOUT a `finish` method, so
   * the grant is continued by polling rather than a browser redirect. This is
   * what lets the benchmark approve grants without Playwright.
   */
  async requestOutgoingPaymentGrant(args: {
    payer: WalletAddress
    debitAmount: Amount
    /**
     * Optional ISO8601 repeating interval (e.g. `R/2026-01-01T00:00:00Z/P1D`).
     * When set, the grant is recurring: `debitAmount` becomes a per-interval
     * maximum that resets every period, so the grant stays usable across runs
     * instead of being spent once. When omitted the grant is single-use.
     */
    interval?: string
  }): Promise<PendingGrantHandle> {
    const grant: PendingGrant | Grant = await this.client.grant.request(
      { url: args.payer.authServer },
      {
        access_token: {
          access: [
            {
              type: 'outgoing-payment',
              actions: ['create', 'read', 'list'],
              identifier: args.payer.id,
              limits: {
                debitAmount: args.debitAmount,
                ...(args.interval ? { interval: args.interval } : {})
              }
            }
          ]
        },
        interact: { start: ['redirect'] }
      }
    )
    if (!isPendingGrant(grant)) {
      throw new Error('Expected a pending interactive outgoing-payment grant.')
    }
    return {
      redirect: grant.interact.redirect,
      continueUri: grant.continue.uri,
      continueToken: grant.continue.access_token.value,
      wait: grant.continue.wait ?? 0
    }
  }

  /**
   * Poll a grant continuation once. Returns the approved grant when a token is
   * present, or null while the grant is still pending approval.
   */
  async continueGrant(
    continueUri: string,
    continueToken: string
  ): Promise<ApprovedGrant | null> {
    const continuation: Grant | GrantContinuation =
      await this.client.grant.continue({
        url: continueUri,
        accessToken: continueToken
      })
    const token = (continuation as Grant).access_token
    if (!token) {
      return null
    }
    return { accessToken: token.value, manageUrl: token.manage }
  }

  /** Rotate an access token via its manage URL. */
  async rotateToken(
    manageUrl: string,
    accessToken: string
  ): Promise<ApprovedGrant> {
    const rotated = await this.client.token.rotate({
      url: manageUrl,
      accessToken
    })
    return {
      accessToken: rotated.access_token.value,
      manageUrl: rotated.access_token.manage
    }
  }
}
