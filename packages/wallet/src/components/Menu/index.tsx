import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'

type NavigationItemProps = {
  name: string
  href: string
}

const navigationItems: NavigationItemProps[] = [
  {
    name: 'Home',
    href: '/'
  },
  {
    name: 'Accounts',
    href: '/accounts'
  },
  {
    name: 'Developer Account',
    href: '/developer'
  },
  {
    name: 'Grants',
    href: '/grants'
  },
  {
    name: 'Settings',
    href: '/settings'
  }
]

export const Menu = () => {
  return (
    <div className="fixed inset-x-0 flex h-20 flex-col md:inset-y-0 md:h-auto md:w-60">
      <div className="flex min-h-0 flex-1 items-center bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7] p-6 md:flex-col md:items-start md:overflow-y-auto md:p-10">
        <Logo className="h-10 w-10 flex-shrink-0 md:h-16 md:w-16" />
        <nav className="mt-14 hidden flex-1 space-y-8  md:block">
          {navigationItems.map((navItem) => (
            <Link
              key={navItem.name}
              href={navItem.href}
              className="flex text-lg font-semibold text-gray-100 text-opacity-80 hover:text-white"
            >
              {/* Icon here */}
              {navItem.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
