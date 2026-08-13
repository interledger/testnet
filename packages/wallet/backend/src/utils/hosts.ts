/**
 * Helpers for deriving browser-facing hosts from RAFIKI_MONEY_FRONTEND_HOST.
 *
 * RAFIKI_MONEY_FRONTEND_HOST must hold the BARE domain (`interledger.cards`),
 * not the wallet subdomain. Two separate things are derived from it, and both
 * break in ways that produce no error if the wrong value is supplied:
 *
 *   - The session cookie `Domain`. The backend is served from a sibling
 *     subdomain (`api.<bare>`), and a server may only set a cookie for its own
 *     host or an ancestor of it. The bare domain is therefore the only value
 *     that `api.<bare>` is allowed to issue AND that `wallet.<bare>` will send
 *     back. Given `wallet.<bare>`, browsers discard the cookie silently and
 *     every request after login is anonymous.
 *
 *   - The browser origins allowed by CORS and by socket.io, which are built by
 *     prefixing the bare domain below.
 */

/** Strip protocol, trailing slashes and surrounding whitespace from a host. */
export const normalizeHost = (host: string): string =>
  host
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')

/**
 * Browser origins allowed to call this backend with credentials. Kept in one
 * place so CORS and socket.io cannot drift apart.
 */
export const getFrontendOrigins = (frontendHost: string): string[] => {
  const bare = normalizeHost(frontendHost)

  return ['http://localhost:4003', `https://${bare}`, `https://wallet.${bare}`]
}

/**
 * Whether a `Set-Cookie` carrying `Domain=cookieDomain` is actually usable by a
 * client talking to `requestHost`. Browsers accept the cookie only when the
 * domain is the request host itself or one of its ancestors; anything else is
 * dropped without a console or network error, so we detect it ourselves.
 */
export const isCookieDomainUsableFrom = (
  requestHost: string,
  cookieDomain: string
): boolean => {
  // Host headers carry a port, cookie domains never do.
  const host = normalizeHost(requestHost).split(':')[0].toLowerCase()
  // A leading dot is legal in a cookie domain and is ignored by browsers.
  const domain = normalizeHost(cookieDomain).replace(/^\./, '').toLowerCase()

  if (!host || !domain) {
    return false
  }

  return host === domain || host.endsWith(`.${domain}`)
}
