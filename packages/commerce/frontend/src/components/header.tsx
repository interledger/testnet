import { useCartStore } from '@/hooks/use-cart-store.ts'
import { MobileNav, MainNav } from './navigation.tsx'
import { ShoppingCartPopover } from './shopping-cart-popover.tsx'

export const Header = () => {
  return (
    <header className="supports-backdrop-blur:bg-white/60 sticky top-0 z-50 w-full border-b bg-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-8">
        <MainNav />
        <div className="flex items-center justify-end">
          <nav className="flex items-center">
            <ShoppingCartPopover />
            <ShoppingCartTotalItems />
          </nav>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

const ShoppingCartTotalItems = () => {
  const { totalItems } = useCartStore()

  return <span className="text-sm">{totalItems}</span>
}
