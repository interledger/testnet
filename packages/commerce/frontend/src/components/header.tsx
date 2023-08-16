import { NavLink } from 'react-router-dom'
import { Navigation } from './navigation.tsx'
import { ShoppingBag } from './icons.tsx'

export const Header = () => {
  return (
    <header className="supports-backdrop-blur:bg-white/60 sticky top-0 z-50 w-full border-b bg-white backdrop-blur">
      <div className="flex h-14 items-center px-8">
        <Navigation />
        <div className="hidden flex-1 items-center justify-between space-x-2 md:flex md:justify-end">
          <nav className="flex items-center">
            <NavLink to="/cart">
              <ShoppingBag className="h-8 w-8 text-green-3 transition-colors hover:text-green" />
              <span className="sr-only">Shopping bag</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}
