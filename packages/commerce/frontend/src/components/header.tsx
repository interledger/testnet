import { NavLink } from 'react-router-dom'
import { MobileNav, MainNav } from './navigation.tsx'
import { ShoppingCart } from './icons.tsx'

export const Header = () => {
  return (
    <header className="supports-backdrop-blur:bg-white/60 sticky top-0 z-50 w-full border-b bg-white backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-8">
        <MainNav />
        <div className="flex items-center justify-end">
          <nav className="flex items-center">
            <NavLink to="/cart">
              <ShoppingCart className="h-6 w-6 text-green-3 transition-colors hover:text-green" />
              <span className="sr-only">Shopping cart</span>
            </NavLink>
          </nav>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
