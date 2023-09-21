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

export const ShoppingCartPopover = () => {
  const [open, setOpen] = useState(false)
  const { items } = useCartStore()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-green-3 transition-colors hover:text-green"
          aria-label="Open shopping cart"
        >
          <ShoppingCart
            className="h-6 w-6 flex-shrink-0"
            aria-label="shopping cart"
          />
          <span className="sr-only">Shopping cart</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60" align="end">
        <div className="grid gap-2">
          <PopoverClose className="ml-auto" asChild>
            <Button
              aria-label="Close menu"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-green-3 transition-colors hover:text-green"
            >
              <X className="w- h-4" />
              <span className="sr-only">Close menu</span>
            </Button>
          </PopoverClose>
          <div className="grid gap-2">
            <ul
              role="list"
              className="max-h-60 gap-y-6 divide-y divide-green-3 overflow-scroll focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {items.length === 0 ? (
                <p className="text-center">No items in cart.</p>
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
  return (
    <li className="flex items-center py-6 text-green first-of-type:pt-0 focus:outline-none focus:ring-2 focus:ring-green-3">
      <img
        src={`${IMAGES_URL}${item.image}`}
        alt={item.name}
        className="h-12 w-12 flex-none rounded-md border border-green-3"
      />
      <div className="ml-4 flex-auto">
        <Link
          to={`/products/${item.slug}`}
          className="rounded-md focus:outline-none focus:ring-2 focus:ring-green-3"
        >
          <h3 className="inline-block">{item.name}</h3>
          <span className="sr-only">View product {item.name}</span>
        </Link>

        <p className="text-sm font-thin">Qty {item.quantity}</p>
      </div>
    </li>
  )
}
