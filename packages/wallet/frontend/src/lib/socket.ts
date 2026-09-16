import { io, type Socket } from 'socket.io-client'

import { BACKEND_URL } from '@/utils/constants'

const stripTrailingSlash = (path: string): string =>
  path === '/' ? '' : path.replace(/\/$/, '')

/**
 * Splits the browser-facing backend address into the parts socket.io needs.
 *
 * An empty value and a value that is only a path both mean "the same origin as
 * this page".
 */
const splitBackendUrl = (
  backendUrl: string
): { origin?: string; prefix: string } => {
  if (!backendUrl) {
    return { prefix: '' }
  }

  if (backendUrl.startsWith('/')) {
    return { prefix: stripTrailingSlash(backendUrl) }
  }

  try {
    const url = new URL(backendUrl)
    return { origin: url.origin, prefix: stripTrailingSlash(url.pathname) }
  } catch {
    console.error(
      `[socket] BACKEND_URL is neither a path nor an absolute URL: ${backendUrl}`
    )
    return { prefix: '' }
  }
}

/**
 * Opens the socket.io connection to the wallet backend.
 *
 * socket.io does not read a URL the way `fetch` does. `io('https://host/wallet-api')`
 * sets the origin to `https://host` and treats `/wallet-api` as a *namespace*,
 * while the transport still polls the default path, `/socket.io`. Where one
 * hostname serves both halves of the wallet, `/socket.io` routes to the
 * frontend, so the connection never reaches the backend and the client retries
 * forever.
 *
 * The prefix belongs in `path`. The browser then polls `/wallet-api/socket.io`,
 * the ingress strips `/wallet-api`, and the backend sees the default path its
 * socket.io server is mounted on.
 */
export const connectToBackend = (): Socket => {
  const { origin, prefix } = splitBackendUrl(BACKEND_URL)

  const options = {
    path: `${prefix}/socket.io`,
    withCredentials: true,
    transports: ['websocket', 'polling']
  }

  return origin ? io(origin, options) : io(options)
}
