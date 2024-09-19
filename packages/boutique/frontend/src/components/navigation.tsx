import { Link, NavLink, NavLinkProps } from 'react-router-dom'
import { Bars3, Logo, Products } from './icons.tsx'
import { Sheet, SheetTrigger, SheetContent } from './ui/sheet.tsx'
import { MenuBubbles } from './bubbles.tsx'
import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils.ts'
import { Button } from './ui/button.tsx'

const NAV_LINKS = [
  {
    to: '/products',
    name: 'Products',
    icon: <Products />
  }
  // {
  //   to: '/orders',
  //   name: 'Orders',
  //   icon: <Orders />
  // }
]

interface MainNavLinkProps extends Omit<NavLinkProps, 'className'> {}

export const MainNavLink = (props: MainNavLinkProps) => {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        cn(
          isActive
            ? 'underline dark:shadow-glow-link dark:no-underline'
            : 'transition-colors hover:underline dark:hover:no-underline dark:hover:shadow-glow-link',
          'rounded-sm focus:outline-none focus:ring-2 focus:ring-green dark:focus:ring-green-neon'
        )
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
      className={cn('transition-colors hover:underline', className)}
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
  return <div className="mx-4 mt-10 flex flex-col gap-y-6">{children}</div>
}

export const MainNav = () => {
  return (
    <div className="flex">
      <Link
        to="/"
        className="mr-6 flex items-center space-x-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green dark:focus:ring-green-neon"
      >
        <Logo className="h-9 w-40 flex-shrink-0" aria-label="Logo" />
      </Link>
      <nav className="hidden items-center space-x-6 font-['DejaVuSansMonoBold'] md:flex">
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
    <Sheet open={open} onOpenChange={setOpen} modal={true}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="ml-4 border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          aria-label="open menu"
        >
          <Bars3 strokeWidth={3} className="h-6 w-6" aria-label="bars menu" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <MobileNavLinks>
          {NAV_LINKS.map(({ to, name, icon }) => (
            <MobileNavLink
              key={to}
              to={to}
              onOpenChange={setOpen}
              className="flex items-center gap-x-2"
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
