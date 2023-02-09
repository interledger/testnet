import { SmallBubbles } from '@/ui/Bubbles'
import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'
import { Dialog, Disclosure, Transition } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'
import { Fragment, type SVGProps, useState } from 'react'
import { Banknotes } from './Icons/Banknotes'
import { Bars } from './Icons/Bars'
import { Chevron } from './Icons/Chevron'
import { Grant } from './Icons/Grant'
import { Home } from './Icons/Home'
import { X } from './Icons/X'

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
        href: '/send'
      },
      {
        name: 'Pay',
        href: '/pay'
      },
      {
        name: 'Request',
        href: '/request'
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
    Icon: Home,
    childrens: [
      {
        name: 'Account',
        href: '/settings/'
      },
      {
        name: 'Developer',
        href: '/settings/developer'
      }
    ]
  }
]

export const Menu = () => {
  const { pathname } = useRouter()
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Menu */}
      <Transition.Root show={sidebarIsOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10 md:hidden"
          onClose={setSidebarIsOpen}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gradient-to-r from-[#92DBCA]/80 to-[#56B1AF]" />
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
                              <Disclosure.Button className="flex w-full items-center justify-between text-xl text-brand-green-4">
                                <div className="flex space-x-3">
                                  <Icon className="h-8 w-8 text-brand-green-3" />
                                  <span className="flex-1">{name}</span>
                                </div>

                                <Chevron
                                  className="h-6 w-6"
                                  direction={open ? 'down' : 'left'}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel className="space-y-1">
                                {childrens.map((children) => (
                                  <Disclosure.Button
                                    key={children.name}
                                    as="a"
                                    href={children.href}
                                    className="flex items-center space-x-4 pl-12 text-lg font-light text-brand-green-4"
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
                          className="font-tight flex items-center space-x-4 text-xl text-brand-green-4"
                        >
                          <Icon className="h-8 w-8 text-brand-green-3" />
                          <span>{name}</span>
                        </Link>
                      )
                    )}
                  </nav>
                </div>
                <SmallBubbles className="absolute inset-x-0 bottom-0 hidden w-full h-sm:block" />
              </Dialog.Panel>
            </Transition.Child>
          </div>
          {/* Menu - END */}
        </Dialog>
      </Transition.Root>
      {/* Mobile Menu - END */}
      {/* Desktop Menu */}
      <nav className="fixed inset-x-0 flex h-20 flex-col md:inset-y-0 md:h-auto md:w-60">
        <div className="flex min-h-0 flex-1 items-center px-6 py-10 md:flex-col md:items-start md:overflow-y-auto md:bg-gradient-to-r md:from-[#00B1D8] md:to-[#6AC1B7]">
          <Logo className="h-10 w-10 flex-shrink-0 md:h-16 md:w-16" />
          <div className="mt-14 hidden flex-1 space-y-8 md:block">
            {menuItems.map(({ name, href, Icon }) => (
              <Link
                key={name}
                href={href}
                className={cx(
                  pathname === href
                    ? 'text-white'
                    : 'text-gray-100/80 hover:text-white',
                  'flex items-center space-x-4 stroke-white text-lg font-semibold'
                )}
              >
                <Icon className="h-6 w-6" />
                <span>{name}</span>
              </Link>
            ))}
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
