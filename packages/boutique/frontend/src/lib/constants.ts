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
      'Set VITE_API_BASE_URL or access via boutique.test for the local HTTPS environment.'
  )
  return 'http://localhost:3004'
}

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl()
export const IMAGES_URL = API_BASE_URL + '/images/'
export const THEME = import.meta.env.VITE_THEME || 'light'
