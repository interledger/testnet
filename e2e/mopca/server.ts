import { createServer, type Server } from 'node:https'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import {
  createAuthenticatedClient,
  isPendingGrant,
  OpenPaymentsClientError,
  type AuthenticatedClient,
  type Grant,
  type GrantContinuation,
  type IncomingPayment,
  type PendingGrant,
  type Quote,
  type WalletAddress
} from '@interledger/open-payments'

/**
 * Mock Open Payments Client App (MOPCA).
 *
 * A minimal, in-process Open Payments *client* that plays the role of a
 * merchant's checkout server. It is authenticated with the merchant's developer
 * keys and:
 *   1. creates an incoming payment on the merchant's wallet address (receiver),
 *   2. quotes the purchase against the customer's wallet address (payer),
 *   3. requests an interactive outgoing-payment grant and redirects the customer
 *      to the ASE (wallet) consent screen to approve it,
 *   4. on return, verifies the interaction hash, continues the grant and creates
 *      the outgoing payment, then polls the incoming payment until the funds have
 *      been received.
 *
 * It is served over HTTPS with the local `*.testnet.test` wildcard certificate.
 * Each instance binds an OS-assigned free port, so multiple instances can run
 * concurrently — reachable at `https://mopca.testnet.test:<port>`.
 */

export const MOPCA_HOST = 'mopca.testnet.test'

export interface MerchantCredentials {
  /** The merchant's wallet address URL — the client's own identity and the receiver. */
  walletAddressUrl: string
  /** The developer key id (the JWKS `kid`) registered on the merchant wallet address. */
  keyId: string
  /** The merchant's private key in PKCS8 PEM format. */
  privateKey: string
}

export interface MopcaItem {
  amount: number
  description: string
}

export interface StartMopcaOptions {
  merchant: MerchantCredentials
  /** The customer's (payer's) wallet address URL. */
  customerWalletAddressUrl: string
  item?: MopcaItem
  /** Absolute path to the TLS cert/key. Defaults to the repo's local certs. */
  certPath?: string
  keyPath?: string
}

export interface MopcaHandle {
  url: string
  host: string
  port: number
  item: MopcaItem
  /** The last completed/failed order result, populated after the finish redirect. */
  getResult(): OrderResult | undefined
  close(): Promise<void>
}

export interface OrderResult {
  orderId: string
  status: 'completed' | 'failed'
  message: string
  /** The amount actually received on the merchant's incoming payment, if completed. */
  receivedAmount?: string
}

interface PendingOrder {
  orderId: string
  quoteId: string
  incomingPaymentUrl: string
  continueUri: string
  continueToken: string
  continueWait: number
  clientNonce: string
  interactNonce: string
  customerWalletAddressUrl: string
  authServer: string
}

const DEFAULT_ITEM: MopcaItem = { amount: 9.99, description: 'testing stuff' }
const DEFAULT_CERT = path.resolve(
  __dirname,
  '../../local/config/certs/local.crt'
)
const DEFAULT_KEY = path.resolve(
  __dirname,
  '../../local/config/certs/local.key'
)

export async function startMopca(
  options: StartMopcaOptions
): Promise<MopcaHandle> {
  const item = options.item ?? DEFAULT_ITEM
  const flow = new OpenPaymentsFlow(options.merchant, item)

  // Building the client discovers the merchant wallet address & auth server and
  // verifies we can talk to the ASE with the supplied credentials.
  await flow.init()

  const orders = new Map<string, PendingOrder>()
  let lastResult: OrderResult | undefined

  const server = createServer(
    {
      cert: readFileSync(options.certPath ?? DEFAULT_CERT),
      key: readFileSync(options.keyPath ?? DEFAULT_KEY)
    },
    (req, res) => {
      handleRequest(req, res).catch((err) => {
        console.error('[MOPCA] request error', err)
        if (!res.headersSent) {
          res.writeHead(500, { 'content-type': 'text/html' })
        }
        res.end(
          page('Error', `<p>Unexpected error: ${escapeHtml(String(err))}</p>`)
        )
      })
    }
  )

  const baseUrl = await listen(server)

  async function handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url ?? '/', baseUrl)

    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(renderStorefront(item))
      return
    }

    if (req.method === 'POST' && url.pathname === '/buy') {
      const orderId = randomUUID()
      const finishUrl = `${baseUrl}/finish?orderId=${orderId}`
      const { pending, redirect } = await flow.preparePayment({
        orderId,
        customerWalletAddressUrl: options.customerWalletAddressUrl,
        finishUrl
      })
      orders.set(orderId, pending)
      res.writeHead(302, { location: redirect })
      res.end()
      return
    }

    if (req.method === 'GET' && url.pathname === '/finish') {
      const orderId = url.searchParams.get('orderId') ?? ''
      const pending = orders.get(orderId)
      if (!pending) {
        res.writeHead(404, { 'content-type': 'text/html' })
        res.end(
          page('Unknown order', '<p id="paymentResult">Unknown order.</p>')
        )
        return
      }

      const result = url.searchParams.get('result')
      if (result) {
        lastResult = {
          orderId,
          status: 'failed',
          message: `Grant not approved (${result}).`
        }
        orders.delete(orderId)
        res.writeHead(200, { 'content-type': 'text/html' })
        res.end(renderResult(lastResult))
        return
      }

      try {
        const received = await flow.completePayment({
          pending,
          interactRef: url.searchParams.get('interact_ref') ?? undefined,
          hash: url.searchParams.get('hash') ?? undefined
        })
        lastResult = {
          orderId,
          status: 'completed',
          message: 'Payment successful.',
          receivedAmount: received
        }
      } catch (err) {
        const message = `Payment failed: ${describeError(err)}`
        console.error('[MOPCA]', message)
        lastResult = { orderId, status: 'failed', message }
      }
      orders.delete(orderId)
      res.writeHead(lastResult.status === 'completed' ? 200 : 502, {
        'content-type': 'text/html'
      })
      res.end(renderResult(lastResult))
      return
    }

    res.writeHead(404, { 'content-type': 'text/html' })
    res.end(page('Not found', '<p>Not found.</p>'))
  }

  const addr = server.address() as AddressInfo
  return {
    url: baseUrl,
    host: MOPCA_HOST,
    port: addr.port,
    item,
    getResult: () => lastResult,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      )
  }
}

/**
 * Listen on an OS-assigned free port bound to loopback and return the
 * `mopca.testnet.test` base URL (which also resolves to loopback via /etc/hosts).
 */
function listen(server: Server): Promise<string> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve(`https://${MOPCA_HOST}:${port}`)
    })
  })
}

class OpenPaymentsFlow {
  private client!: AuthenticatedClient
  private merchantWalletAddress!: WalletAddress

  constructor(
    private merchant: MerchantCredentials,
    private item: MopcaItem
  ) {}

  async init(): Promise<void> {
    this.client = await createAuthenticatedClient({
      walletAddressUrl: this.merchant.walletAddressUrl,
      keyId: this.merchant.keyId,
      privateKey: this.merchant.privateKey,
      // Local ASE responses can lag the published OpenAPI spec; skip strict
      // response validation so the test focuses on the payment flow itself.
      validateResponses: false
    })

    // Sanity check: prove we can reach the ASE with the merchant credentials.
    this.merchantWalletAddress = await this.client.walletAddress.get({
      url: this.merchant.walletAddressUrl
    })
  }

  async preparePayment(args: {
    orderId: string
    customerWalletAddressUrl: string
    finishUrl: string
  }): Promise<{ pending: PendingOrder; redirect: string }> {
    const customerWalletAddress = await this.client.walletAddress.get({
      url: args.customerWalletAddressUrl
    })

    const incomingPayment = await this.createIncomingPayment(
      this.merchantWalletAddress
    )

    const quote = await this.createQuote({
      walletAddress: customerWalletAddress,
      receiver: incomingPayment.id
    })

    const clientNonce = randomUUID()
    const grant = await this.createOutgoingPaymentGrant({
      walletAddress: customerWalletAddress,
      debitAmount: quote.debitAmount,
      receiver: incomingPayment.id,
      nonce: clientNonce,
      finishUrl: args.finishUrl
    })

    return {
      pending: {
        orderId: args.orderId,
        quoteId: quote.id,
        incomingPaymentUrl: incomingPayment.id,
        continueUri: grant.continue.uri,
        continueToken: grant.continue.access_token.value,
        continueWait: grant.continue.wait ?? 0,
        clientNonce,
        interactNonce: grant.interact.finish,
        customerWalletAddressUrl: customerWalletAddress.id,
        authServer: customerWalletAddress.authServer
      },
      redirect: grant.interact.redirect
    }
  }

  async completePayment(args: {
    pending: PendingOrder
    interactRef?: string
    hash?: string
  }): Promise<string> {
    const { pending, interactRef, hash } = args
    this.verifyHash({
      interactRef,
      receivedHash: hash,
      clientNonce: pending.clientNonce,
      interactNonce: pending.interactNonce,
      authServer: pending.authServer
    })

    const continuation = await this.continueGrant({
      accessToken: pending.continueToken,
      url: pending.continueUri,
      interactRef,
      wait: pending.continueWait
    }).catch((err) => {
      throw labelError('grant.continue', err)
    })

    const customerWalletAddress = await this.client.walletAddress.get({
      url: pending.customerWalletAddressUrl
    })

    await this.client.outgoingPayment
      .create(
        {
          url: customerWalletAddress.resourceServer,
          accessToken: continuation.accessToken
        },
        {
          walletAddress: pending.customerWalletAddressUrl,
          quoteId: pending.quoteId,
          metadata: {
            description: `MOPCA purchase: ${this.item.description}`,
            orderRef: pending.orderId
          }
        }
      )
      .catch((err) => {
        throw labelError('outgoingPayment.create', err)
      })

    return this.waitForIncomingPayment(pending.incomingPaymentUrl)
  }

  private async createIncomingPayment(
    walletAddress: WalletAddress
  ): Promise<IncomingPayment> {
    const accessToken = await this.getIncomingPaymentToken(
      walletAddress.authServer
    )
    return this.client.incomingPayment.create(
      { url: walletAddress.resourceServer, accessToken },
      {
        expiresAt: new Date(Date.now() + 6000 * 60 * 5).toISOString(),
        walletAddress: walletAddress.id,
        incomingAmount: this.toAmount(walletAddress),
        metadata: { description: `MOPCA purchase: ${this.item.description}` }
      }
    )
  }

  private async createQuote(args: {
    walletAddress: WalletAddress
    receiver: string
  }): Promise<Quote> {
    const grant = await this.requestNonInteractiveGrant(
      args.walletAddress.authServer,
      { type: 'quote', actions: ['create', 'read'] }
    )
    return this.client.quote.create(
      {
        url: args.walletAddress.resourceServer,
        accessToken: grant.access_token.value
      },
      {
        method: 'ilp',
        walletAddress: args.walletAddress.id,
        receiver: args.receiver
      }
    )
  }

  private async createOutgoingPaymentGrant(args: {
    walletAddress: WalletAddress
    debitAmount: Quote['debitAmount']
    receiver: string
    nonce: string
    finishUrl: string
  }): Promise<PendingGrant> {
    const grant = await this.client.grant.request(
      { url: args.walletAddress.authServer },
      {
        access_token: {
          access: [
            {
              type: 'outgoing-payment',
              actions: ['create', 'read', 'list'],
              identifier: args.walletAddress.id,
              limits: { debitAmount: args.debitAmount, receiver: args.receiver }
            }
          ]
        },
        interact: {
          start: ['redirect'],
          finish: { method: 'redirect', uri: args.finishUrl, nonce: args.nonce }
        }
      }
    )

    if (!isPendingGrant(grant)) {
      throw new Error('Expected an interactive outgoing-payment grant.')
    }
    return grant
  }

  private async getIncomingPaymentToken(authServer: string): Promise<string> {
    const grant = await this.requestNonInteractiveGrant(authServer, {
      type: 'incoming-payment',
      actions: ['create', 'read', 'list']
    })
    return grant.access_token.value
  }

  private async requestNonInteractiveGrant(
    authServer: string,
    access: { type: string; actions: string[] }
  ): Promise<Grant & { access_token: NonNullable<Grant['access_token']> }> {
    const grant = await this.client.grant.request(
      { url: authServer },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore — `interact` is optional for non-interactive grants.
      { access_token: { access: [access] } }
    )
    if (isPendingGrant(grant) || !grant.access_token) {
      throw new Error(`Expected a non-interactive ${access.type} grant.`)
    }
    return grant as Grant & { access_token: NonNullable<Grant['access_token']> }
  }

  private async continueGrant(args: {
    accessToken: string
    url: string
    interactRef?: string
    wait?: number
  }): Promise<{ accessToken: string; manageUrl: string }> {
    if (!args.interactRef) {
      throw new Error('Missing interact_ref on grant continuation.')
    }

    // GNAP requires the client to wait for the grant's `wait` period before
    // continuing; continuing early is rejected with `too_fast`. Wait, then
    // retry a few times to absorb clock skew.
    let waitMs = Math.max(args.wait ?? 0, 1) * 1000
    let lastError: unknown
    for (let attempt = 0; attempt < 4; attempt++) {
      await sleep(waitMs + 500)
      try {
        const continuation = await this.client.grant.continue(
          { accessToken: args.accessToken, url: args.url },
          { interact_ref: args.interactRef }
        )
        if (!isGrantWithToken(continuation)) {
          throw new Error('Grant continuation did not return an access token.')
        }
        return {
          accessToken: continuation.access_token.value,
          manageUrl: continuation.access_token.manage
        }
      } catch (err) {
        if (err instanceof OpenPaymentsClientError && err.code === 'too_fast') {
          lastError = err
          waitMs = Math.max(waitMs, 1000)
          continue
        }
        throw err
      }
    }
    throw lastError ?? new Error('Grant continuation timed out.')
  }

  private verifyHash(args: {
    interactRef?: string
    receivedHash?: string
    clientNonce: string
    interactNonce: string
    authServer: string
  }): void {
    if (!args.interactRef) throw new Error('Missing interact_ref.')
    if (!args.receivedHash) throw new Error('Missing interaction hash.')

    const data = `${args.clientNonce}\n${args.interactNonce}\n${args.interactRef}\n${args.authServer}`
    const hash = createHash('sha-256').update(data).digest('base64')
    if (hash !== args.receivedHash) {
      throw new Error(
        `Interaction hash mismatch (received "${args.receivedHash}", computed "${hash}").`
      )
    }
  }

  /** Poll the merchant's incoming payment until the full amount has been received. */
  private async waitForIncomingPayment(url: string): Promise<string> {
    const accessToken = await this.getIncomingPaymentToken(
      this.merchantWalletAddress.authServer
    )
    const expected = this.toAmount(this.merchantWalletAddress).value

    for (let attempt = 0; attempt < 30; attempt++) {
      const incomingPayment = await this.client.incomingPayment.get({
        url,
        accessToken
      })
      if (BigInt(incomingPayment.receivedAmount.value) >= BigInt(expected)) {
        return incomingPayment.receivedAmount.value
      }
      await sleep(2000)
    }
    throw new Error(
      `Incoming payment "${url}" did not receive the expected amount (${expected}).`
    )
  }

  private toAmount(walletAddress: WalletAddress): {
    value: string
    assetCode: string
    assetScale: number
  } {
    return {
      value: Math.round(
        this.item.amount * 10 ** walletAddress.assetScale
      ).toString(),
      assetCode: walletAddress.assetCode,
      assetScale: walletAddress.assetScale
    }
  }
}

function isGrantWithToken(
  continuation: Grant | GrantContinuation
): continuation is Grant & {
  access_token: NonNullable<Grant['access_token']>
} {
  return (continuation as Grant).access_token !== undefined
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function labelError(step: string, err: unknown): Error {
  return new Error(`[${step}] ${describeError(err)}`)
}

function describeError(err: unknown): string {
  if (err instanceof OpenPaymentsClientError) {
    const parts = [err.description || err.message]
    if (err.status) parts.push(`status=${err.status}`)
    if (err.code) parts.push(`code=${err.code}`)
    if (err.validationErrors?.length) {
      parts.push(`validation=${err.validationErrors.join('; ')}`)
    }
    return `OpenPaymentsClientError(${parts.join(', ')})`
  }
  return String(err)
}

function renderStorefront(item: MopcaItem): string {
  return page(
    'MOPCA',
    `
    <h1>Mock Open Payments Client App</h1>
    <p id="itemDescription">${escapeHtml(item.description)}</p>
    <p id="itemPrice">${item.amount.toFixed(2)} EUR</p>
    <form method="POST" action="/buy">
      <button id="buyStuff" type="submit">Buy stuff</button>
    </form>
    `
  )
}

function renderResult(result: OrderResult): string {
  return page(
    result.status === 'completed' ? 'Payment successful' : 'Payment failed',
    `
    <h1 id="paymentResult" data-status="${result.status}">${
      result.status === 'completed' ? 'Payment successful' : 'Payment failed'
    }</h1>
    <p id="paymentMessage">${escapeHtml(result.message)}</p>
    ${
      result.receivedAmount
        ? `<p id="receivedAmount">${escapeHtml(result.receivedAmount)}</p>`
        : ''
    }
    `
  )
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title></head><body>${body}</body></html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
