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
    name: 'Developer',
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

const Sidebar = () => {
  return (
    <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col">
      <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7]">
        <div className="flex flex-1 flex-col overflow-y-auto pt-10 pb-4">
          <div className="flex flex-shrink-0 items-center px-10">
            <Logo className="h-16 w-16" />
          </div>
          <nav className="mt-14 flex-1 space-y-8 px-10">
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
    </div>
  )
}

export default Sidebar
