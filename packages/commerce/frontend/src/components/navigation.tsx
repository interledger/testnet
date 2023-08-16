import { NavLink } from 'react-router-dom'
import { Logo } from './icons.tsx'

export const Navigation = () => {
  return (
    <div className="flex">
      <NavLink to="/" className="mr-6 flex items-center space-x-2">
        <span className="inline-block">
          <Logo className="h-9 w-9 flex-shrink-0" />
        </span>
      </NavLink>
      <nav className="hidden items-center space-x-6 font-medium md:flex">
        <NavLink
          to="/"
          // className="text-green-3 transition-colors hover:text-green"
          className={({ isActive }) =>
            isActive
              ? 'text-green'
              : 'text-green-3 transition-colors hover:text-green'
          }
        >
          Products
        </NavLink>
        <NavLink
          to="/orders"
          className="text-green-3 transition-colors hover:text-green"
        >
          Orders
        </NavLink>
      </nav>
    </div>
  )
}
