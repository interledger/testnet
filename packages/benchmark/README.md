# @benchmark/open-payments

An Open Payments **partial-payment throughput benchmark** for Interledger TestNet.

It measures how quickly a large payment concludes when paid as many small
partial payments: it creates one fixed-amount incoming payment on a receiver,
then fires `amount / paymentSize` concurrent slices (each an
`receiveAmount`-fixed quote + outgoing payment) into it until the incoming
payment is fully settled. The headline metric is **time to conclude** — from the
first slice to full settlement.

The same code runs against a local stack and against real testnet; nothing is
environment-specific.

## Install & build

```bash
pnpm install
pnpm --filter @benchmark/open-payments build
```

## Run

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0;

# from the repo root — `benchmark` is a root script that filters to this package
pnpm benchmark bench ./packages/benchmark/config.yaml --grants ./packages/benchmark/grants.json
# from inside packages/benchmark — use the package's own `bench` script
pnpm run bench ./config.yaml --grants ./grants.json
# or after building, invoke the CLI directly
node packages/benchmark/dist/cli.js ./config.yaml --grants ./grants.json
```

Two things that commonly trip people up:

- **`pnpm benchmark` only exists at the repo root.** It's the root-level script
  `"benchmark": "pnpm --filter @benchmark/open-payments --"`. Inside
  `packages/benchmark` there is no `benchmark` script — use `pnpm run bench`
  there instead (the first positional arg is the config path).
- **Against the local stack, set `NODE_TLS_REJECT_UNAUTHORIZED=0`.** The local
  ASE serves `*.testnet.test` with a self-signed certificate, so without this the
  very first call (resolving the wallet address) fails with
  `Error making Open Payments GET request`. It is **not** needed against real
  testnet, which has valid certificates.

```bash
# local stack (self-signed certs)
NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run bench ./config.yaml --grants ./grants.json
```

## Configuration

```yaml
client: # one developer key signs every request (a dedicated benchmark wallet address)
  walletAddressUrl: https://rafiki-backend.testnet.test/accounts/benchmark
  keyId: 0e0e...
  privateKey: ./benchmark.key # PKCS8 PEM: path (resolved relative to the config) or inline
output: ./results/run.json # optional; JSON metrics (console output is always printed)
sequential: false # optional; run scenarios one-at-a-time instead of concurrently
skipQuote: false # optional; create payments directly from the incoming payment, no per-slice quote
limitlessGrant: true # optional; request the grant with NO debit limit (default true) — see Validity notes
grantInterval: P1D # optional; ISO8601 period for the recurring grant when limitlessGrant is false
incomingExpiryMs: 2588400000 # optional; incoming-payment lifetime (default: just under Rafiki's 30-day max)
payments:
  - amount: 1000000 # total, minor units at amountScale ($10,000.00)
    amountScale: 2
    paymentSize: 100 # per-slice, minor units ($1.00) → 10,000 slices
    fromWalletAddress: https://.../alice # payer (debited)
    toWalletAddress: https://.../bob # receiver (credited)
    workers: 10
    # accessToken / manageUrl: optional pre-approved grant (real testnet)
```

Constraints enforced by config validation: `amount` must be an exact multiple of
`paymentSize`, and the payer/receiver must differ.

`amount` and `paymentSize` are denominated in the **receiver's** asset (the tool
fills a fixed incoming payment on the receiver), so `amountScale` must match the
**receiver's** asset scale. The payer may use a **different asset** — each slice
is a fixed-delivery quote, so cross-currency pairs settle via the quote's FX
conversion. For a cross-currency run the outgoing-payment grant's `debitAmount`
limit can't be assumed equal to `amount`; the CLI sizes it by probing the
exchange rate (quoting one slice) and summing `perSliceDebit × slices` across the
payer's scenarios, plus a small buffer for rounding and rate drift.

## Skipping the quote (`skipQuote`)

Each slice normally does two calls: a `receiveAmount`-fixed quote, then an
outgoing-payment create against that quote. With `skipQuote: true` the tool
creates each payment **directly from the incoming payment** with a fixed
`debitAmount` — Open Payments allows `incomingPayment` + `debitAmount` in place
of a `quoteId` — removing one round-trip per slice from the hot path.

The per-slice debit is resolved **once** at scenario start, so workers never
quote:

- **Same-asset pair** — the debit equals the delivered `paymentSize` (no network
  call at all).
- **Cross-currency pair** — a single upfront quote establishes the payer-side
  debit (FX rate and any fee); that fixed debit is reused for every slice.

Because a cross-currency debit is pinned once and reused, mid-run rate drift is
not re-quoted per slice; the delivered amount per slice is whatever Rafiki
settles for that fixed debit, so the incoming payment may conclude a hair
above/below the exact target on a drifting rate. For a same-asset pair the debit
and delivery are identical, so the fill is exact.

## Grant approval (local and real testnet, no browser automation)

Creating outgoing payments requires an interactive grant approved by the payer.
This tool uses one uniform, Playwright-free flow everywhere: it requests the
grant **without** a `finish` redirect and then **polls** the GNAP continuation.
It prints a consent URL; a human opens it once per payer, approves in their
wallet, and the tool captures and caches the token (`grants.json`, keyed by
payer). Cached tokens are reused and auto-rotated via their manage URL. On real
testnet you may instead paste a pre-approved `accessToken`/`manageUrl` per
scenario.

## Validity / lifetimes (making grants and quotes last)

The tool asks for the longest-lived grant and incoming payment the protocol
allows, so an approved grant survives across runs and the fill target does not
expire under you. What each lever can and cannot do:

- **Grant — limitless by default, so it never exhausts.** The grant is
  requested with **no debit limit** (`limitlessGrant: true`, the default). It
  can fund any number of runs, and on Rafiki a limit-less grant also skips the
  per-grant row lock that serialises concurrent creates — so create throughput
  is higher. Approve once, then rerun freely against the cached grant. The
  trade-off is that the approved grant authorises **unbounded debit** on the
  payer, which is why it is meant for a dedicated benchmark wallet.

  To cap the authorised spend instead, set `limitlessGrant: false`. The grant is
  then sized to the run's total debit (see Design notes) **plus an ISO8601
  repeating `interval`** (`grantInterval`, default `P1D`) that makes the
  `debitAmount` a *per-interval* maximum which resets each period — reusable, but
  **one run's worth of budget per period**. More than one full run inside a
  single period exhausts it and further creates fail with `403 unauthorized`
  (`Aborting scenario after N consecutive failures`); shorten `grantInterval`,
  set it to `""` for a single-use grant, or delete `grants.json` and re-approve:

  ```bash
  rm -f ./grants.json && NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run bench ./config.yaml --grants ./grants.json
  ```

- **Grant access token — auto-rotated.** The token's `expires_in` is set by the
  auth server, not the client; the tool rotates it via the manage URL as it
  nears expiry, so a long run is never interrupted by token expiry.

- **Incoming payment — maxed out.** Its `expiresAt` is client-controlled and
  defaults to just under Rafiki's 30-day cap (`INCOMING_PAYMENT_EXPIRY_MAX_MS`);
  override with `incomingExpiryMs`. Rafiki rejects an expiry beyond `now + max`,
  so the default sits one hour under the cap to absorb clock skew.

- **Quote — server-controlled, cannot be extended by the client.** A quote's
  `expiresAt` is read-only in Open Payments; Rafiki sets it to `now +
  QUOTE_LIFESPAN` (default 5 minutes). No request field lets the client lengthen
  it. This is a non-issue for the benchmark: each slice consumes its quote with
  the outgoing-payment create immediately, so the 5-minute window is never
  approached. If you genuinely need longer-lived quotes, that is a Rafiki
  server setting (`QUOTE_LIFESPAN`), outside this client tool.

## Prerequisites (out of scope for this tool)

Configured at the ASE level, not by the benchmark: accounts and wallet
addresses exist, and the payer is funded for the run (≥ `amount` for a
same-asset run, or the FX-equivalent debit for a cross-currency run). A per-slice
sending fee is tolerated — the grant limit is sized from a probe quote that
already includes it — but a large fee widens the debit the payer must cover.

## Design notes

- **Reservation dispenser** — workers reserve one of exactly `N = amount /
paymentSize` slots before paying, so concurrency can never over-issue past the
  incoming payment's fixed amount; failed attempts release their slot for retry.
- **Failure budget** — a scenario aborts after N consecutive non-recoverable
  failures (e.g. a dry payer), preventing infinite retry loops.
- **Grant limit note** — by default (`limitlessGrant: true`) the grant carries
  **no `limits`**: it never exhausts, and Rafiki skips the per-grant row lock
  that serialises concurrent creates, so create throughput is highest. When
  `limitlessGrant: false`, the grant is instead requested with a
  `limits.debitAmount` sized to the run's total debit: `perSliceDebit × slices`
  summed across the payer's scenarios, where `perSliceDebit` comes from a probe
  quote (so it reflects FX and any fee). For a same-asset pair this is exactly
  `amount`; cross-currency adds a small buffer for rounding and rate drift. That
  `debitAmount` is paired with a repeating `interval` (`grantInterval`, default
  `P1D`) so it is a *per-interval* cap that resets each period rather than a
  one-shot total. Note a non-empty `debitAmount` re-enables the per-grant row
  lock, capping create throughput — another reason the limitless grant is the
  default for throughput runs.

## Tests

```bash
pnpm --filter @benchmark/open-payments test:coverage
```
