import { NavLink, NavLinkProps } from 'react-router-dom'
import { Bars3, Logo, Orders, Products } from './icons.tsx'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from './ui/sheet.tsx'
import { MenuBubbles } from './bubbles.tsx'
import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils.ts'

const NAV_LINKS = [
  {
    to: '/',
    name: 'Products',
    icon: <Products />
  },
  {
    to: '/orders',
    name: 'Orders',
    icon: <Orders />
  }
]

interface MainNavLinkProps extends Omit<NavLinkProps, 'className'> {}

export const MainNavLink = (props: MainNavLinkProps) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        isActive
          ? 'text-green'
          : 'text-green-3 transition-colors hover:text-green'
      }
    />
  )
}

interface MobileNavLinkProps extends NavLinkProps {
  onOpenChange: (open: boolean) => void
}

const MobileNavLink = ({
  to,
  onOpenChange,
  className,
  children,
  ...props
}: MobileNavLinkProps) => {
  return (
    <NavLink
      to={to}
      onClick={() => {
        onOpenChange(false)
      }}
      className={cn(
        'text-green-3 transition-colors hover:text-green',
        className
      )}
      {...props}
    >
      {children}
    </NavLink>
  )
}

interface MobileNavLinksProps {
  children: ReactNode
}

export const MobileNavLinks = ({ children }: MobileNavLinksProps) => {
  return <div className="mx-4 mt-6 flex flex-col gap-y-6">{children}</div>
}

export const MainNav = () => {
  return (
    <div className="flex">
      <NavLink to="/" className="mr-6 flex items-center space-x-2">
        <span className="inline-block">
          <Logo className="h-9 w-9 flex-shrink-0" />
        </span>
      </NavLink>
      <nav className="hidden items-center space-x-6 font-medium md:flex">
        {NAV_LINKS.map(({ to, name }) => (
          <MainNavLink key={to} to={to}>
            {name}
          </MainNavLink>
        ))}
      </nav>
    </div>
  )
}

export const MobileNav = () => {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <Bars3
          strokeWidth={3}
          className="ml-4 h-6 w-6 text-green-3 transition-colors hover:text-green md:hidden"
        />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="-space-y-2">
          <SheetTitle>Interledger</SheetTitle>
          <SheetDescription className="font-medium">eCommerce</SheetDescription>
        </SheetHeader>
        <MobileNavLinks>
          {NAV_LINKS.map(({ to, name, icon }) => (
            <MobileNavLink
              key={to}
              to={to}
              onOpenChange={setOpen}
              className="flex items-center gap-x-2 text-lg"
            >
              {icon}
              {name}
            </MobileNavLink>
          ))}
        </MobileNavLinks>
        <MenuBubbles className="absolute inset-x-0 bottom-0 hidden w-full h-sm:block" />
      </SheetContent>
    </Sheet>
  )
}
