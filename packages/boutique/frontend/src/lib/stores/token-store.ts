import { valtioPersist } from '../valtio-persist'

interface TokenState {
  token?: string
}

const state: TokenState = {}

export const tokenStore = valtioPersist<TokenState>('token-store', state)

export function setToken(token: string) {
  tokenStore.token = token
}

export function getToken() {
  return tokenStore.token
}
