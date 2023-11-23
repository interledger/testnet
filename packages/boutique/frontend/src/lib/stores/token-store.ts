import { resetStore, valtioPersist } from '../valtio-persist'

interface TokenState {
  accessToken: string
  manageUrl: string
}

const state: TokenState = {
  accessToken: '',
  manageUrl: ''
}

export const tokenStore = valtioPersist<TokenState>('token-store', state)

export function setToken(args: TokenState) {
  tokenStore.manageUrl = args.manageUrl
  tokenStore.accessToken = args.accessToken
}

export function getToken() {
  return tokenStore
}

export function resetToken(): void {
  resetStore(tokenStore, state)
}
