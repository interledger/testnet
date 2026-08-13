# E2E Tests

End-to-end tests for the Interledger Test Wallet, written with [Playwright](https://playwright.dev/) and [playwright-bdd](https://vitalets.github.io/playwright-bdd/).

## Feature files

Tests are written in [Gherkin](https://cucumber.io/docs/gherkin/reference/) — a plain-language format that describes behaviour as `Given / When / Then` steps. Feature files live in `features/*.feature` and their step implementations in `features/steps/*.steps.ts`.

Each `.feature` file corresponds to a user-facing scenario. `bddgen` (run automatically as part of `pnpm test`) compiles the feature files into Playwright spec files before the test runner starts.

## Email verification

The wallet requires email verification before a new user can log in. In production this sends a link via Sendgrid. In local development `SEND_EMAIL=false` is set, so the link is only logged to stdout.

Rather than parsing backend logs or running an SMTP capture server, tests bypass email delivery entirely:

1. After signup, a fresh random token is generated in the test helper.
2. Its SHA-256 hash is written directly to the `users.verifyEmailToken` column in Postgres.
3. `POST /verify-email/:token` is called against the wallet backend on `http://localhost:3003`.

Step 3 runs the real verification code path — it sets `isEmailVerified = true`, clears the token, and calls MockGatehub `createManagedUser` to obtain a `gateHubUserId`. This is necessary: without `gateHubUserId` the KYC page returns 404.

This approach was chosen because:

- It requires no changes to the wallet backend or email service.
- It does not depend on an SMTP server being available in CI or locally.
- It exercises the actual verification endpoint rather than faking the DB state directly.

The DB URL and backend URL default to the local dev values and can be overridden via `TEST_DB_URL` and `TEST_API_URL` in `e2e/.env` (see `.env.example`).

## Account isolation

Every test run creates a unique user with a timestamped email address (`e2e-<timestamp>-<random>@ilp.com`). This means:

- Tests are independent — they do not share accounts or session state.
- The full suite can be run in parallel without accounts interfering with each other.
- Re-running a test after failure is safe; leftover accounts in the DB do not affect the new run.

**When adding or modifying tests**, keep this principle in mind:

- Always create a fresh account (via `setupVerifiedUser` or `createUniqueCredentials`) rather than reusing a shared fixture account.
- Avoid assertions that depend on the total count of accounts, transactions, or other global state that may accumulate across runs.
- If a test needs a pre-funded account, fund it programmatically within the test rather than relying on prior state.

## Open Payments purchase (MOPCA)

`open-payments-purchase.feature` exercises a full [Open Payments](https://openpayments.dev/)
workflow end to end using a **Mock Open Payments Client App (MOPCA)** — a
minimal, in-process Open Payments _client_ that plays the role of a merchant's
checkout server ([`mopca/server.ts`](mopca/server.ts)).

The scenario:

1. Creates a fresh **merchant** (EUR) user and generates developer keys via
   _Settings → Developer Keys → Generate_ (nickname `e2e`). The private key is
   captured from the success dialog; the keyId/public key are read from the
   `walletAddressKeys` table.
2. Creates a fresh **customer** (EUR) user and deposits 100 EUR.
3. Starts a MOPCA instance authenticated with the merchant's keys. On startup it
   verifies it can reach the ASE with those credentials.
4. The customer browses to the MOPCA storefront and buys "testing stuff" for
   9.99 EUR. MOPCA creates an incoming payment (merchant), a quote (customer) and
   an interactive outgoing-payment grant, then redirects the customer to the ASE
   consent screen.
5. The customer approves; the ASE redirects back to MOPCA, which continues the
   grant, creates the outgoing payment and polls the incoming payment until the
   funds are received.
6. The merchant's transactions are checked for the incoming 9.99 EUR credit.

### `mopca.testnet.test` host + TLS

MOPCA is served over HTTPS using the local `*.testnet.test` wildcard cert on an
OS-assigned free port, reachable at `https://mopca.testnet.test:<port>`. Multiple
instances can therefore run concurrently.

`mopca.testnet.test` must resolve to loopback. The Playwright config maps it at
the browser level via a Chromium `--host-resolver-rules` launch arg, so **no
`/etc/hosts` change is required** to run the test. `mopca.testnet.test` is also
included in `pnpm local:hosts` (useful for manual `curl`/browser debugging
outside the test) — re-run that once (with sudo) if you want the host entry too:

```bash
pnpm local:hosts
```

The Node-side Open Payments client must trust the self-signed cert. The `test`
scripts set `NODE_EXTRA_CA_CERTS=../local/config/certs/local.crt` for this; no
extra configuration is needed when running via `pnpm e2e:test`.

## Running the tests

**Prerequisites**: full local stack running (`pnpm local:setup && pnpm dev`).

```bash
# Install Playwright browsers (once per machine)
pnpm e2e:install

# Run all scenarios headless
pnpm e2e:test

# Run with a visible browser
pnpm e2e:test:headed
```

See the root [README.md](../README.md) for full setup instructions.
