import { MenuBubbles } from '@/ui/Bubbles'
import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'
import { Dialog, Disclosure, Transition } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'
import { Fragment, type SVGProps, useState } from 'react'
import { Banknotes } from './icons/Banknotes'
import { Bars } from './icons/Bars'
import { Chevron } from './icons/Chevron'
import { Cog } from './icons/Cog'
import { Grant } from './icons/Grant'
import { Home } from './icons/Home'
import { X } from './icons/X'

type MenuItemProps = {
  name: string
  href: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
  childrens?: {
    name: string
    href: string
  }[]
}

const menuItems: MenuItemProps[] = [
  {
    name: 'Home',
    href: '/',
    Icon: Home
  },
  {
    name: 'Transfer',
    href: '/transfer',
    Icon: Banknotes,
    childrens: [
      {
        name: 'Send',
        href: '/transfer/send'
      },
      {
        name: 'Pay',
        href: '/transfer/pay'
      },
      {
        name: 'Request',
        href: '/transfer/request'
      }
    ]
  },
  {
    name: 'Grants',
    href: '/grants',
    Icon: Grant
  },
  {
    name: 'Settings',
    href: '/settings',
    Icon: Cog,
    childrens: [
      {
        name: 'Account',
        href: '/settings'
      },
      {
        name: 'Developer',
        href: '/settings/api'
      }
    ]
  }
]

export const Menu = () => {
  const pathname = `/${useRouter().pathname.split('/')?.slice(1)[0] ?? ''}`
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu */}
      <Transition.Root show={sidebarIsOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-20 md:hidden"
          onClose={setSidebarIsOpen}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-90"
            leave="transition-opacity duration-500"
            leaveFrom="opacity-90"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gradient-overlay" />
          </Transition.Child>
          {/* Backdrop - END */}
          {/* Menu */}
          <div className="fixed inset-y-0 right-0 flex max-w-full">
            <Transition.Child
              as={Fragment}
              enter="transform transition duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative flex w-64 flex-col overflow-hidden rounded-l-3xl bg-white pl-4 pt-5 pb-4">
                <button
                  className="ml-auto mr-4 inline-block"
                  type="button"
                  onClick={() => setSidebarIsOpen(false)}
                >
                  <X strokeWidth={3} className="h-8 w-8" />
                </button>
                <div className="overflow-y-auto">
                  <nav className="space-y-5 pl-8 pr-5">
                    {menuItems.map(({ name, href, Icon, childrens }) =>
                      childrens ? (
                        <Disclosure as="div" key={name} className="space-y-1">
                          {({ open }) => (
                            <>
                              <Disclosure.Button className="flex w-full items-center justify-between text-xl text-green outline-none">
                                <div className="flex space-x-4">
                                  <Icon className="h-8 w-8 text-green-3" />
                                  <span className="flex-1">{name}</span>
                                </div>

                                <Chevron
                                  className="h-6 w-6 transition-transform duration-100"
                                  direction={open ? 'down' : 'left'}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="space-y-1">
                                {childrens.map((children) => (
                                  <Disclosure.Button
                                    key={children.name}
                                    as={Link}
                                    href={children.href}
                                    className="flex items-center space-x-4 pl-12 text-lg font-light text-green"
                                  >
                                    {children.name}
                                  </Disclosure.Button>
                                ))}
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      ) : (
                        <Link
                          key={name}
                          href={href}
                          className="flex items-center space-x-4 text-xl text-green"
                        >
                          <Icon className="h-8 w-8 text-green-3" />
                          <span>{name}</span>
                        </Link>
                      )
                    )}
                  </nav>
                </div>
                <MenuBubbles className="absolute inset-x-0 bottom-0 hidden w-full h-sm:block" />
              </Dialog.Panel>
            </Transition.Child>
          </div>
          {/* Menu - END */}
        </Dialog>
      </Transition.Root>
      {/* Mobile Menu - END */}
      {/* Desktop Menu */}
      <nav className="fixed inset-x-0 z-10 flex h-20 flex-col bg-white shadow-md md:inset-y-0 md:h-auto md:w-60 md:shadow-none">
        <div className="flex min-h-0 flex-1 items-center px-6 py-10 md:flex-col md:items-start md:overflow-y-auto md:bg-gradient-primary">
          <div className="flex items-center font-semibold text-green">
            <Logo className="h-10 w-10 flex-shrink-0 md:h-16 md:w-16" />
            <div className="pl-2">
              <div className="text-lg md:text-2xl">Interledger</div>
              <div className="text-sm md:text-lg">testnet</div>
            </div>
          </div>
          <div className="mt-14 hidden w-full flex-1 space-y-8 md:block">
            {menuItems.map(({ name, href, Icon, childrens }) =>
              childrens ? (
                <Disclosure as="div" key={name} className="space-y-1">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex w-full items-center justify-between text-lg font-semibold outline-none">
                        <div
                          className={cx(
                            pathname === href
                              ? 'text-white'
                              : 'text-green hover:text-white',
                            'flex items-center space-x-4'
                          )}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="flex-1">{name}</span>
                        </div>

                        <Chevron
                          className="h-6 w-6 transition-transform duration-100"
                          direction={open ? 'down' : 'left'}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="space-y-1">
                        {childrens.map((children) => (
                          <Disclosure.Button
                            key={children.name}
                            as={Link}
                            href={children.href}
                            className="flex items-center space-x-4 pl-10 hover:text-white"
                            onClick={() => setSidebarIsOpen(false)}
                          >
                            {children.name}
                          </Disclosure.Button>
                        ))}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ) : (
                <Link
                  key={name}
                  href={href}
                  className={cx(
                    pathname === href
                      ? 'text-white'
                      : 'text-green hover:text-white',
                    'flex items-center space-x-4 text-lg font-semibold'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{name}</span>
                </Link>
              )
            )}
          </div>

          <div className="ml-auto flex md:hidden">
            <button
              aria-label="open menu"
              onClick={() => setSidebarIsOpen(true)}
            >
              <Bars strokeWidth={2.5} className="h-10 w-10" />
            </button>
          </div>
        </div>
      </nav>
      {/* Desktop Menu - END*/}
    </>
  )
}
