import { Product } from '@/hooks/useProductsQuery'
import { resetStore, valtioPersist } from '@/lib/valtio-persist.ts'
import { watch } from 'valtio/utils'

export interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
}

const state = {
  items: [],
  totalItems: 0
}

export const cartStore = valtioPersist<CartState>('cart-store', state)

export function addToCart(product: Product, quantity: number = 1): void {
  const currentItem = cartStore.items.find((item) => item.id === product.id)
  if (!currentItem) {
    cartStore.items.push(Object.assign({}, product, { quantity }))
  } else {
    cartStore.items = cartStore.items.map((item) => {
      if (item.id === product.id) {
        item.quantity += quantity
      }
      return item
    })
  }
}

export function removeFromCart(id: string): void {
  cartStore.items.filter((item) => item.id !== id)
}

export function increaseQuantity(id: string): void {
  const index = cartStore.items.findIndex((item) => item.id === id)
  cartStore.items[index].quantity += 1
}

export function decreaseQuantity(id: string): void {
  const index = cartStore.items.findIndex((item) => item.id === id)
  cartStore.items[index].quantity -= 1
}

export function resetCart(): void {
  resetStore(cartStore, state)
}

watch((get) => {
  get(cartStore)
  let totalItems = 0
  for (let i = 0; i < cartStore.items.length; i++) {
    totalItems += cartStore.items[i].quantity
  }
  cartStore.totalItems = totalItems
})
