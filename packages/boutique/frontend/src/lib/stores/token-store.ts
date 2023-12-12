import { resetStore, valtioPersist } from '../valtio-persist'

export interface TokenState {
  accessToken: string
  manageUrl: string
  walletAddressUrl: string
}

const state: TokenState = {
  accessToken: '',
  manageUrl: '',
  walletAddressUrl: ''
}

export const tokenStore = valtioPersist<TokenState>('token-store', state)

export function setToken(args: TokenState) {
  tokenStore.manageUrl = args.manageUrl
  tokenStore.accessToken = args.accessToken
  tokenStore.walletAddressUrl = args.walletAddressUrl
}

export function getToken() {
  return tokenStore
}

export function resetToken(): void {
  resetStore(tokenStore, state)
}
