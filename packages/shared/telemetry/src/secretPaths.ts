import type { PathRedaction } from './redact'

// Wallet URLs whose path carries a secret. Both components pass this list: the
// frontend serves the pages and calls the backend endpoints, so its spans hold
// both kinds. Add a route here when it puts a token in the path.
//
// `[^/:[]` leaves a route template alone: Express's `:token` and Next.js's
// `[token]` are no secret, and they name the span.
const SEGMENT = '[^/:[][^/]*'

export const WALLET_SECRET_PATHS: PathRedaction[] = [
  // Backend: password reset and e-mail verification links.
  [new RegExp(`/reset-password/${SEGMENT}`), '/reset-password/{token}'],
  [new RegExp(`/verify-email/${SEGMENT}`), '/verify-email/{token}'],
  // Backend: an Open Payments grant interaction and its nonce.
  [
    new RegExp(`/grant-interactions/${SEGMENT}/${SEGMENT}`),
    '/grant-interactions/{interactionId}/{nonce}'
  ],
  // Frontend: the pages those links open.
  [new RegExp(`/auth/reset/${SEGMENT}`), '/auth/reset/{token}'],
  [new RegExp(`/auth/verify/${SEGMENT}`), '/auth/verify/{token}']
]
