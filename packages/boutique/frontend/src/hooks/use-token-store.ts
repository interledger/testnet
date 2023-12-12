import { useSnapshot } from 'valtio'
import { tokenStore } from '@/lib/stores/token-store'

export function useTokenStore() {
  return useSnapshot(tokenStore)
}
