import { useCartStore } from '@/hooks/use-cart-store.ts'
import { MobileNav, MainNav } from './navigation.tsx'
import { ShoppingCartPopover } from './shopping-cart-popover.tsx'
import { ThemeToggle } from './theme-toggle.tsx'

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-purple-dark">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-8">
        <MainNav />
        <div className="flex items-center justify-end">
          <nav className="flex items-center">
            <ShoppingCartPopover />
            <ShoppingCartTotalItems />
            <ThemeToggle />
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
