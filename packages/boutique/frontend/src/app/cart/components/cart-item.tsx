import { Minus, Plus } from '@/components/icons.tsx'
import { Button } from '@/components/ui/button.tsx'
import { IMAGES_URL } from '@/lib/constants.ts'
import {
  CartItem as TCartItem,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart
} from '@/lib/stores/cart-store.ts'
import { useThemeContext } from '@/lib/theme'
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
  const { theme } = useThemeContext()
  return (
    <CartItemContext.Provider value={{ item: item }}>
      <li key={item.id} className="flex py-6 first-of-type:pt-0">
        <div className="flex-shrink-0 rounded-md border border-green dark:border-pink-neon bg-green-light dark:bg-purple-dark">
          <img
            src={`${IMAGES_URL}${theme === 'light' ? item.image : item.imageDark}`}
            alt={item.name}
            className="h-24 w-24 object-scale-down object-center"
          />
        </div>
        <div className="flex flex-1 items-start justify-between">
          <div className="ml-4 flex flex-col">
            <div className="flex justify-between">
              <Link
                to={`/products/${item.slug}`}
                className="rounded-md font-['DejaVuSansMonoBold'] text-xl focus:outline-none focus:ring-2 focus:ring-green dark:focus:ring-green-neon"
              >
                {item.name}
              </Link>
            </div>
            <p className="mt-1 text-sm font-light">Qty: {item.quantity}</p>
            <p className="text-sm font-light">
              Price per unit: {formatPrice(item.price)}
            </p>
            <p className="text-sm">
              Total: {formatPrice(item.quantity * item.price)}
            </p>
          </div>
          <ItemQuantity />
        </div>
      </li>
    </CartItemContext.Provider>
  )
}

interface QuantityButtonProps {
  'action': () => void
  'children': ReactNode
  'aria-label': string
}

const QuantityButton = ({
  action,
  children,
  ...props
}: QuantityButtonProps) => {
  return (
    <Button
      onClick={() => action()}
      variant="ghost"
      className="h-9 w-9 rounded-[calc(.375rem-0.175rem)] bg-green-light dark:bg-purple-dark p-2 focus:ring-2 focus:ring-green dark:focus:ring-green-neon"
      {...props}
    >
      {children}
    </Button>
  )
}

const ItemQuantity = () => {
  const { item } = useContext(CartItemContext)

  return (
    <div className="flex flex-col gap-y-2">
      <div className="w-28 rounded-md border-2 border-green-light dark:border-pink-neon p-0.5 md:w-32">
        <div className="flex items-center space-x-0.5">
          <QuantityButton
            aria-label="decrease quantity"
            action={() => decreaseQuantity(item.id)}
          >
            <Minus strokeWidth={3} />
          </QuantityButton>
          <input
            readOnly
            tabIndex={-1}
            value={item.quantity}
            name="quantity"
            className="w-full border-none p-0 text-center focus:outline-none dark:bg-purple"
          />
          <QuantityButton
            aria-label="increase quantity"
            action={() => increaseQuantity(item.id)}
          >
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
