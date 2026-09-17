import { io, type Socket } from 'socket.io-client'

import { BACKEND_URL } from '@/utils/constants'

const stripTrailingSlash = (path: string): string =>
  path === '/' ? '' : path.replace(/\/$/, '')

/** An empty value or a bare path both mean the origin that served the page. */
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
 * socket.io does not read a URL the way `fetch` does:
 * `io('https://host/wallet-api')` treats `/wallet-api` as a namespace and still
 * polls the default `/socket.io` path, which routes to the frontend where one
 * hostname serves both halves. The prefix belongs in `path` instead.
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
