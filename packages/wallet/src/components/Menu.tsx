import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'
import { Disclosure, Transition } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'
import { Fragment } from 'react'
import { Bars } from './icons/Bars'
import { Home } from './icons/Home'
import { X } from './icons/X'

type NavigationItemProps = {
  name: string
  href: string
  icon: JSX.Element
}

const navigationItems: NavigationItemProps[] = [
  {
    name: 'Home',
    href: '/',
    icon: <Home className="h-6 w-6" />
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: <Home className="h-6 w-6" />
  },
  {
    name: 'Developer Account',
    href: '/developer',
    icon: <Home className="h-6 w-6" />
  },
  {
    name: 'Grants',
    href: '/grants',
    icon: <Home className="h-6 w-6" />
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: <Home className="h-6 w-6" />
  }
]

export const Menu = () => {
  const { pathname } = useRouter()

  return (
    <Disclosure as="nav">
      {({ open }) => (
        <>
          <div className="fixed inset-x-0 flex h-20 flex-col md:inset-y-0 md:h-auto md:w-60">
            <div className="flex min-h-0 flex-1 items-center bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7] p-6  md:flex-col md:items-start md:overflow-y-auto">
              <Logo className="h-10 w-10 flex-shrink-0 md:h-16 md:w-16" />
              <div className="mt-14 hidden flex-1 space-y-8 md:block">
                {navigationItems.map((navItem) => (
                  <Link
                    key={navItem.name}
                    href={navItem.href}
                    className={cx(
                      pathname === navItem.href
                        ? 'text-white'
                        : 'text-gray-100/80 hover:text-white',
                      'flex items-center space-x-4 text-lg font-semibold '
                    )}
                  >
                    {navItem?.icon}
                    <span>{navItem.name}</span>
                  </Link>
                ))}
              </div>

              <div className="ml-auto flex md:hidden">
                <Disclosure.Button className="rounded-m inline-flex items-center justify-center text-white/70 hover:text-white focus:outline-none">
                  {open ? (
                    <>
                      <X className="h-8 w-8 " />
                      <span className="sr-only">Close main menu</span>
                    </>
                  ) : (
                    <>
                      <Bars className="h-8 w-8 " />
                      <span className="sr-only">Open main menu</span>
                    </>
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Transition as={Fragment}>
            <Transition.Child
              enter="transition-all ease-linear duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-all ease-linear duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Disclosure.Panel className="absolute inset-0 z-20 mt-20 block bg-black/30 md:hidden">
                <div className="flex flex-col border-t border-gray-300 bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7] shadow-md">
                  <div className="space-y-4 px-6 py-8">
                    {navigationItems.map((navItem) => (
                      <Disclosure.Button
                        as={Link}
                        key={navItem.name}
                        href={navItem.href}
                        className={cx(
                          pathname === navItem.href
                            ? 'text-white'
                            : 'text-gray-100/80 hover:text-white',
                          'flex items-center space-x-4 text-lg font-semibold '
                        )}
                      >
                        {navItem?.icon}
                        <span>{navItem.name}</span>
                      </Disclosure.Button>
                    ))}
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition.Child>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
