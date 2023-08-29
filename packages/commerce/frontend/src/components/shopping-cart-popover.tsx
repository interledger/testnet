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
import { Link, useNavigate } from 'react-router-dom'
import { CartItem } from '@/lib/stores/cart-store.ts'
import { KeyboardEvent } from 'react'

export const ShoppingCartPopover = () => {
  const { items } = useCartStore()
  const navigate = useNavigate()

  function handleKeyDown(href: string) {
    return function (e: KeyboardEvent<HTMLHeadingElement>) {
      switch (e.key) {
        case 'Enter':
          navigate(href)
          break
      }
    }
  }

  return (
    <Popover>
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
              className="max-h-60 divide-y divide-gray-200 overflow-scroll focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              {items.map((item) => (
                <ShoppingCartItem
                  key={item.id}
                  item={item}
                  onKeyDown={handleKeyDown(`/products/${item.slug}`)}
                />
              ))}
            </ul>
          </div>
          {/* TODO: Redirect to shopping cart page */}
          <Button aria-label="go to shopping cart">View shopping cart</Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ShoppingCartItemProps {
  item: CartItem
  onKeyDown: (e: KeyboardEvent<HTMLHeadingElement>) => void
}

const ShoppingCartItem = ({ item, onKeyDown }: ShoppingCartItemProps) => {
  return (
    <li className="flex items-center py-6 focus-visible:outline-none focus-visible:ring-1">
      <img
        src={`${IMAGES_URL}${item.image}`}
        alt={item.name}
        className="h-12 w-12 flex-none rounded-md border border-gray-200"
      />
      <div className="ml-4 flex-auto">
        <h3
          className="inline-block font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-3"
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          <Link to={`/products/${item.slug}`}>{item.name}</Link>
          <span className="sr-only">View product {item.name}</span>
        </h3>
        <p className="text-sm font-thin">Qty {item.quantity}</p>
      </div>
    </li>
  )
}
