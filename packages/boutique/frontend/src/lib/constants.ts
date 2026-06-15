  declare global {
  interface Window {
    __env__?: {
      API_BASE_URL?: string
      THEME?: string
      CURRENCY?: string
    }
  }
}

const windowEnv = typeof window !== 'undefined' ? window.__env__ : undefined

// Resolve the boutique API base URL at runtime based on the current hostname.
// In the local HTTPS environment the frontend is served behind Traefik at
// "boutique.test", so we route API calls to its TLS-proxied backend.
// Outside that environment (plain localhost dev) we still fall back to the
// local backend port.
const getDefaultApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'boutique.test') {
      return 'https://api.boutique.test'
    }
  }

  console.warn(
    'Boutique API: falling back to http://localhost:3004. ' +
      'Set API_BASE_URL (runtime) or VITE_API_BASE_URL (build-time), or access via boutique.test.'
  )
  return 'http://localhost:3004'
}

export const API_BASE_URL =
  windowEnv?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()
export const IMAGES_URL = API_BASE_URL + '/images/'
export const THEME = windowEnv?.THEME || import.meta.env.VITE_THEME || 'light'
export const CURRENCY = windowEnv?.CURRENCY || import.meta.env.VITE_CURRENCY || 'USD'
