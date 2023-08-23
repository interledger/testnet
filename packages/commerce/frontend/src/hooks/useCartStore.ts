import { useSnapshot } from 'valtio'
import { cartStore } from '@/lib/stores/cart-store.ts'

export function useCartStore() {
  return useSnapshot(cartStore)
}
