/**
 * Shared types for the Open Payments throughput benchmark.
 *
 * The benchmark drives many small "partial" Open Payments payments into a
 * single fixed-amount incoming payment and measures how quickly the whole
 * amount settles. See the package README for the full design.
 */

/** An Open Payments monetary amount (minor units). */
export interface Amount {
  value: string
  assetCode: string
  assetScale: number
}

/**
 * The single client identity that signs every Open Payments request. This is a
 * developer key generated once on a dedicated benchmark wallet address.
 */
export interface ClientConfig {
  /** The client's own wallet address URL (its Open Payments identity). */
  walletAddressUrl: string
  /** The JWKS key id (`kid`) registered on that wallet address. */
  keyId: string
  /**
   * The PKCS8 PEM private key. May be provided inline or as a path to a file;
   * {@link resolvePrivateKey} normalises it to the raw PEM contents.
   */
  privateKey: string
}

/** One benchmark scenario: fill one incoming payment via many small payments. */
export interface PaymentScenarioConfig {
  /** Total incoming amount in minor units (e.g. 1000000 == $10,000.00 at scale 2). */
  amount: number
  /** Asset scale for `amount` and `paymentSize`. Must match both wallet addresses. */
  amountScale: number
  /** Per-slice amount in minor units (e.g. 100 == $1.00 at scale 2). */
  paymentSize: number
  /** The payer wallet address URL (debited). */
  fromWalletAddress: string
  /** The receiver wallet address URL (credited). */
  toWalletAddress: string
  /** Number of concurrent workers firing payments for this scenario. */
  workers: number
  /**
   * Optional pre-approved outgoing-payment grant access token for the payer.
   * Used on real testnet where the grant is approved out-of-band. When omitted,
   * the runner obtains one via interactive poll-based approval.
   */
  accessToken?: string
  /** The manage URL for {@link accessToken}, enabling token rotation. */
  manageUrl?: string
}

/** The full benchmark configuration, parsed from the YAML config file. */
export interface BenchmarkConfig {
  client: ClientConfig
  /** Path to write the machine-readable JSON results to. */
  output?: string
  /**
   * Path to write the per-payment CSV to (one row per payment attempt; see
   * {@link PaymentSample}). Defaults to `output` with its extension swapped to
   * `.csv` (e.g. `results/run.json` → `results/run.csv`).
   */
  csvOutput?: string
  /** Run scenarios one-at-a-time instead of concurrently. */
  sequential?: boolean
  /** Log per-slice request timing (quote + create latency) as slices complete. */
  verbose?: boolean
  /**
   * Measure per-payment submit→settle latency by polling each outgoing payment
   * to full settlement (adds read load; off by default).
   */
  settleLatency?: boolean
  /**
   * Skip the per-slice quote and create each outgoing payment directly from the
   * incoming payment with a fixed `debitAmount` (resolved once per scenario).
   * Removes one network round-trip per slice; off by default.
   */
  skipQuote?: boolean
  /**
   * Request the outgoing-payment grant with NO debit limit. The grant never
   * exhausts across any number of runs, and Rafiki skips the per-grant row lock
   * (higher create throughput). Trade-off: the approved grant authorizes
   * unbounded debit on the payer — intended for a dedicated benchmark wallet.
   * Defaults to `true`; set `false` to request a sized, recurring grant.
   */
  limitlessGrant?: boolean
  /**
   * ISO8601 period (e.g. `P1D`, `PT1H`) for the recurring outgoing-payment
   * grant. Only applies when `limitlessGrant` is false. The grant is requested
   * as `R/{start}/{period}`, so its debit allowance resets every period and the
   * cached grant is reusable across runs instead of single-use. Set to an empty
   * string to request a single-use grant. Defaults to `P1D`.
   */
  grantInterval?: string
  /**
   * Incoming-payment lifetime in ms. Defaults to just under Rafiki's 30-day
   * maximum so the fill target stays valid as long as the protocol allows.
   */
  incomingExpiryMs?: number
  payments: PaymentScenarioConfig[]
}

/** A grant token bundle, cached per payer wallet address for reuse. */
export interface CachedGrant {
  accessToken: string
  manageUrl?: string
  /** The GNAP continuation URI, retained for diagnostics. */
  continueUri?: string
}

/** Reasons a single payment slice can fail, used for the metrics breakdown. */
export type FailureReason =
  | 'grant_locked'
  | 'token_expired'
  | 'insufficient_liquidity'
  | 'already_full'
  | 'other'

/** The end state of a payment attempt from the benchmark client's perspective. */
export type PaymentOutcome = 'success' | 'failure'

/** A client-observed state a payment attempt passes through. */
export type PaymentState = 'quote' | 'create'

/**
 * One payment attempt — a single quote+create cycle — as the benchmark client
 * observed it, captured for the per-payment CSV. Each retry (after a token
 * refresh or a timeout re-queue) is recorded as its own attempt/row. Durations
 * are wall-clock milliseconds the client spent in each state; `settleMs` is
 * filled in asynchronously once the created payment is seen fully sent (only
 * when `settleLatency` measurement is enabled).
 */
export interface PaymentSample {
  /** 1-based scenario index; scenario N corresponds to `config.payments[N-1]`. */
  scenario: number
  /** Monotonic attempt number within the scenario (unique per attempt). */
  attempt: number
  /** Zero-based id of the worker that performed the attempt. */
  worker: number
  /** Ms from the scenario's timed start to when this attempt began (time axis). */
  offsetMs: number
  /** Ms spent in the quote state (≈0 when skip-quote is enabled). */
  quoteMs: number
  /** Ms spent in the create state. */
  createMs: number
  /**
   * Ms from create returning to the payment being fully sent. Present only when
   * `settleLatency` is on and the attempt succeeded and then settled.
   */
  settleMs?: number
  /** `quoteMs + createMs` — client time to the attempt's end state. */
  totalMs: number
  /** The attempt's end state. */
  outcome: PaymentOutcome
  /** On failure, the state the attempt failed in; absent on success. */
  failedState?: PaymentState
  /** On failure, the classified reason; absent on success. */
  errorReason?: FailureReason
  /**
   * On failure, a diagnostic string (HTTP status / GNAP code / description, e.g.
   * a request timeout surfaces here); absent on success.
   */
  errorDetail?: string
}

/** Immutable summary of a single scenario's run, safe to serialise to JSON. */
export interface ScenarioSummary {
  label: string
  fromWalletAddress: string
  toWalletAddress: string
  /** Target number of slices (amount / paymentSize). */
  targetSlices: number
  /** The receiver's asset code (settled value and amounts are denominated in it). */
  assetCode: string
  /** The receiver's asset scale (minor-unit exponent for {@link settledValue}). */
  assetScale: number
  /** Slices that were created successfully. */
  succeeded: number
  /** Failure counts keyed by {@link FailureReason}. */
  failures: Record<string, number>
  /** Whether the incoming payment reached its full amount. */
  concluded: boolean
  /** Minor-unit value received on the incoming payment when the run ended. */
  settledValue: string
  /** Wall-clock ms from the first slice to all slices submitted. */
  submitMs: number
  /** Wall-clock ms from the first slice to full settlement (the headline number). */
  settleMs: number
  /** Successful create operations per second (over submitMs). */
  createsPerSecond: number
  /** Settled minor units per second (over settleMs). */
  settledPerSecond: number
  quoteLatencyMs: LatencySummary
  createLatencyMs: LatencySummary
  /**
   * End-to-end submit→settle latency per payment (create returned → outgoing
   * payment fully sent). Present only when `settleLatency` measurement is on.
   */
  settleLatencyMs?: LatencySummary
}

export interface LatencySummary {
  count: number
  p50: number
  p95: number
  max: number
}

export interface BenchmarkResult {
  startedAt: string
  finishedAt: string
  scenarios: ScenarioSummary[]
}
