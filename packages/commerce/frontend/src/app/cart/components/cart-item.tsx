import { Minus, Plus } from '@/components/icons.tsx'
import { Button } from '@/components/ui/button.tsx'
import { IMAGES_URL } from '@/lib/constants.ts'
import {
  CartItem as TCartItem,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart
} from '@/lib/stores/cart-store.ts'
import { formatPrice } from '@/lib/utils.ts'
import { createContext, ReactNode, useContext } from 'react'
import { Link } from 'react-router-dom'

interface CartItemProps {
  item: TCartItem
}

type CartItemContextValue = CartItemProps

export const CartItemContext = createContext<CartItemContextValue>(
  {} as CartItemContextValue
)

export const CartItem = ({ item }: CartItemProps) => {
  return (
    <CartItemContext.Provider value={{ item: item }}>
      <li key={item.id} className="flex py-6 sm:py-10">
        <div className="flex-shrink-0 rounded-md border border-green-3 bg-green-1">
          <img
            src={`${IMAGES_URL}${item.image}`}
            alt={item.name}
            className="h-24 w-24 object-cover object-center"
          />
        </div>
        <div className="flex flex-1 items-start justify-between">
          <div className="ml-4 flex flex-col sm:ml-6">
            <div className="flex justify-between">
              <Link
                to={`/products/${item.slug}`}
                className="text-xl font-medium"
              >
                {item.name}
              </Link>
            </div>
            <p className="mt-1 text-sm font-light">
              Price per unit: {formatPrice(item.price)}
            </p>
          </div>
          <ItemQuantity />
        </div>
      </li>
    </CartItemContext.Provider>
  )
}

interface QuantityButtonProps {
  action: () => void
  children: ReactNode
}

const QuantityButton = ({ action, children }: QuantityButtonProps) => {
  return (
    <Button
      aria-label="decrease"
      variant="ghost"
      className="h-9 w-9 rounded-[calc(.375rem-0.175rem)] bg-green-5 p-2 text-white hover:bg-green-6"
      onClick={() => action()}
    >
      {children}
    </Button>
  )
}

const ItemQuantity = () => {
  const { item } = useContext(CartItemContext)

  return (
    <div className="flex flex-col gap-y-2">
      <div className="w-32 rounded-md border-2 border-green-4 p-0.5">
        <div className="flex items-center">
          <QuantityButton action={() => decreaseQuantity(item.id)}>
            <Minus strokeWidth={3} />
          </QuantityButton>
          <input
            readOnly
            value={item.quantity}
            name="quantity"
            className="w-full text-center focus:outline-none"
          />
          <QuantityButton action={() => increaseQuantity(item.id)}>
            <Plus strokeWidth={3} />
          </QuantityButton>
        </div>
      </div>
      <RemoveItem />
    </div>
  )
}

const RemoveItem = () => {
  const { item } = useContext(CartItemContext)
  return (
    <Button
      variant="secondary"
      aria-label="remove item"
      onClick={() => removeFromCart(item.id)}
    >
      Remove
    </Button>
  )
}
