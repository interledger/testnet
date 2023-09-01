import { Product } from '@/hooks/use-products-query'
import { resetStore, valtioPersist } from '@/lib/valtio-persist.ts'
import { watch } from 'valtio/utils'

export interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

const state = {
  items: [],
  totalItems: 0,
  totalAmount: 0
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
  const index = cartStore.items.findIndex((item) => item.id === id)
  cartStore.items[index].quantity = Infinity
  cartStore.items.splice(index, 1)
}

export function increaseQuantity(id: string): void {
  const index = cartStore.items.findIndex((item) => item.id === id)
  cartStore.items[index].quantity += 1
}

export function decreaseQuantity(id: string): void {
  const index = cartStore.items.findIndex((item) => item.id === id)
  cartStore.items[index].quantity -= 1
  if (cartStore.items[index].quantity <= 0) {
    cartStore.items[index].quantity = Infinity
    cartStore.items.splice(index, 1)
  }
}

export function setQuantity(id: string, quantity: number) {
  const index = cartStore.items.findIndex((item) => item.id === id)
  cartStore.items[index].quantity = quantity
}

export function resetCart(): void {
  resetStore(cartStore, state)
}

watch((get) => {
  get(cartStore.items)
  let totalItems = 0
  let totalAmount = 0
  for (let i = 0; i < cartStore.items.length; i++) {
    totalItems += cartStore.items[i].quantity
    totalAmount += cartStore.items[i].price * cartStore.items[i].quantity
  }
  cartStore.totalItems = totalItems
  cartStore.totalAmount = totalAmount
})
