# E2E Findings And Initial Plan

## Scope

This document captures:

- how the existing Playwright smoke tests in `testnet-deploy` work
- how those tests map onto the `testnet` wallet codebase
- which UI hooks are safe to use for local `testnet` e2e coverage
- the first local flow to automate in `testnet/e2e`

## What The Existing Smoke Test Does

The smoke test in `testnet-deploy/smoke-tests/playwright/tests/test-cross-currency-transfers.spec.ts` is a deployed-environment browser test that:

1. Logs into the wallet.
2. Scrapes account cards from the dashboard.
3. Opens each account and extracts a payment pointer.
4. Navigates to the send flow.
5. Selects source account and wallet address.
6. Enters a recipient wallet address.
7. Waits for backend validation and quote calls.
8. Accepts the quote.
9. Confirms success.

That suite relies on two kinds of hooks:

- accessible selectors: labels, roles, button names, link names
- explicit element ids: `selectAccount`, `selectWalletAddress`, `addRecipientWalletAddress`, `acceptQuote`, `closeButtonSuccess`

## How That Maps To `testnet`

The deployed smoke test is not arbitrary. Its selectors line up with real wallet frontend source in `testnet`:

- `packages/wallet/frontend/src/pages/send.tsx`
  - `#selectAccount`
  - `#selectWalletAddress`
  - `#addRecipientWalletAddress`
  - `#addAmount`
- `packages/wallet/frontend/src/components/dialogs/QuoteDialog.tsx`
  - `#acceptQuote`
- `packages/wallet/frontend/src/components/dialogs/SuccessDialog.tsx`
  - `#closeButtonSuccess`
- `packages/wallet/frontend/src/components/Menu.tsx`
  - navigation labels `Accounts`, `Send`, `Request`
- `packages/wallet/frontend/src/components/cards/AccountCard.tsx`
  - account cards render as real links with `href="account/{id}"`

The backend routes the deployed smoke test waits on are also real `testnet` backend routes:

- `POST /login`
- `GET /accounts/:accountId/wallet-addresses`
- `GET /external-wallet-addresses`
- `POST /quotes`
- `POST /outgoing-payments`

## Safe UI Hooking Strategy

### Preferred selectors

Use these in order of preference:

1. `getByRole(...)` when the element has a stable accessible role and name.
2. `getByLabel(...)` for form fields that are already labeled.
3. Stable ids already present in the app when the flow intentionally exposes them.
4. Structural selectors only when there is no semantic hook available.

### Hooks that are safe right now

For the initial local auth flow, these are the safest hooks:

- signup page
  - email: label `E-mail *`
  - password: label `Password *`
  - confirm password: label `Confirm password *`
  - submit: `form button[type="submit"]`
- signup success
  - success copy: `A verification link has been sent to your email account.`
  - redirect button: role `link` or `button` with name `Go to login page`
- verify page
  - success heading text: `Your email has been verified.`
  - login CTA: role `link` with name `Login to your account`
- login page
  - email: label `E-mail *`
  - password: label `Password *`
  - submit: `form button[type="submit"]`
- local KYC page
  - iframe element on `/kyc`
  - inside iframe: labels `First Name`, `Last Name`, `Date of Birth`, `Address`, `City`, `Country`
  - submit button id `submitBtn`
- dashboard
  - heading `Accounts`
  - account cards: `a[href*="/account/"]`
- account page
  - heading `Balance`

### Hooks to avoid unless necessary

- scraping anonymous `span` order inside account cards
- matching on visual decoration or icon-only content
- depending on React Select generated ids unless there is no better hook
- broad text fragments that may appear in multiple dialogs

## Local Signup Verification Reality

The first important local-specific finding is that email verification cannot be recovered from the database alone.

Why:

- the backend stores `verifyEmailToken` as a SHA-256 hash
- the plaintext token is generated server-side and never returned to the browser
- a database query can confirm a token hash exists, but it cannot reconstruct the original verification URL

In local development, the practical verification-link sources are:

1. wallet-backend logs
2. a future dedicated test email transport

The current local default is `SEND_EMAIL=false`, and the backend logs a line containing the verification URL. That makes log retrieval the cleanest current approach and avoids database reads entirely.

## Important Local Flow Constraint

Email verification alone is not enough to land on the dashboard.

A newly verified user is still redirected to `/kyc` after login until KYC finishes. In local development this is expected, because:

- login session state sets `needsIDProof` when `kycVerified` is still false
- frontend middleware redirects authenticated users with `needsIDProof=true` to `/kyc`
- the local KYC page embeds the MockGatehub iframe
- submitting that iframe triggers `addUserToGateway`, which creates the default account and wallet address in local sandbox flow

That means any local test that wants to assert the dashboard and default account must either:

- complete the KYC iframe flow, or
- bypass real behavior and mutate application state directly

The first option is the correct e2e approach.

## Initial Local Test Plan

The first `testnet/e2e` test should do this:

1. Open local wallet signup page.
2. Create a unique email and valid password.
3. Submit signup via the UI.
4. Read the verification URL from `wallet-backend-local` logs.
5. Open the verification URL in the browser.
6. Log in via the UI.
7. Complete the local MockGatehub KYC iframe.
8. Assert the dashboard is visible.
9. Assert the default account card exists.
10. Open that account and assert the account details page loads.

## Non-Goals For The First Test

- no direct DB reads for auth, users, accounts, or sessions
- no API shortcuts for signup/login in place of the UI
- no direct state mutation to skip KYC
- no cross-currency transfer coverage yet

## Open Follow-Ups

- If we want email retrieval without Docker logs, we need a test-friendly mail transport instead of SendGrid-only delivery.
- For future flows, adding explicit `data-testid` hooks to a few auth and dashboard surfaces would reduce coupling to current copy.
- The deployed smoke test can be refactored when ported so it stops depending on `span` ordering inside account cards.