import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover.tsx'
import { ShoppingCart, X } from './icons.tsx'
import { useCartStore } from '@/hooks/use-cart-store.ts'
import { Button } from './ui/button.tsx'
import { IMAGES_URL } from '@/lib/constants.ts'
import { PopoverClose } from '@radix-ui/react-popover'
import { Link } from 'react-router-dom'
import { CartItem } from '@/lib/stores/cart-store.ts'
import { useState } from 'react'
import { useThemeContext } from '@/lib/theme.ts'

export const ShoppingCartPopover = () => {
  const [open, setOpen] = useState(false)
  const { items } = useCartStore()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="" aria-label="Open shopping cart">
          <ShoppingCart
            className="h-6 w-6 flex-shrink-0"
            aria-label="shopping cart"
          />
          <span className="sr-only">Shopping cart</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 dark:bg-purple-dark" align="end">
        <div className="grid gap-2">
          <PopoverClose className="ml-auto" asChild>
            <Button
              aria-label="Close menu"
              variant="ghost"
              className="h-6 w-6 p-0 text-green dark:text-white"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Close menu</span>
            </Button>
          </PopoverClose>
          <div className="grid gap-2">
            <ul
              role="list"
              className="max-h-60 gap-y-6 divide-y overflow-scroll focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {items.length === 0 ? (
                <p className="text-center text-green dark:text-white">
                  No items in cart.
                </p>
              ) : null}
              {items.map((item) => (
                <ShoppingCartItem key={item.id} item={item} />
              ))}
            </ul>
          </div>
          <PopoverClose asChild>
            <Button aria-label="go to shopping cart" asChild>
              <Link to="/cart" role="button">
                View shopping cart
              </Link>
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ShoppingCartItemProps {
  item: CartItem
}

const ShoppingCartItem = ({ item }: ShoppingCartItemProps) => {
  const { theme } = useThemeContext()
  return (
    <li className="flex items-center dark:text-white py-6 first-of-type:pt-0 focus:outline-none focus:ring-2 focus:ring-green dark:focus:ring-green-neon">
      <img
        src={`${IMAGES_URL}${theme === 'light' ? item.image : item.imageDark}`}
        alt={item.name}
        className="h-12 w-12 flex-none rounded-md border border-green dark:border-pink-neon bg-green-light dark:bg-purple"
      />
      <div className="ml-4 flex-auto">
        <Link
          to={`/products/${item.slug}`}
          className="rounded-md focus:outline-none focus:ring-2 focus:ring-green dark:focus:ring-green-neon"
        >
          <h3 className="inline-block">{item.name}</h3>
          <span className="sr-only">View product {item.name}</span>
        </Link>

        <p className="text-sm font-thin">Qty {item.quantity}</p>
      </div>
    </li>
  )
}
