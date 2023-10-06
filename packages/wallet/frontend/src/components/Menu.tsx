import { userService } from '@/lib/api/user'
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
import { Logout } from './icons/Logout'
import { X } from './icons/X'
import { Transactions } from './icons/Transactions'

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
        name: 'Request',
        href: '/transfer/request'
      }
    ]
  },
  {
    name: 'Transactions',
    href: '/transactions',
    Icon: Transactions
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
        name: 'Developer Keys',
        href: '/settings/developer-keys'
      }
    ]
  }
]

export const Menu = () => {
  const router = useRouter()
  const pathname = `/${router.pathname.split('/')?.slice(1)[0] ?? ''}`
  const [sidebarIsOpen, setSidebarIsOpen] = useState(false)

  const handleLogout = async () => {
    const res = await userService.logout()
    if (res.success) {
      router.push('/auth')
    }
  }

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
              <Dialog.Panel className="relative flex w-64 flex-col overflow-hidden rounded-l-3xl bg-white pb-4 pl-4 pt-5">
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
                                    onClick={() => setSidebarIsOpen(false)}
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
                          onClick={() => setSidebarIsOpen(false)}
                          className="flex items-center space-x-4 text-xl text-green"
                        >
                          <Icon className="h-8 w-8 text-green-3" />
                          <span>{name}</span>
                        </Link>
                      )
                    )}
                  </nav>
                </div>
                <div className="mt-auto space-y-5 pl-8 pr-5">
                  <button
                    onClick={handleLogout}
                    aria-label="logout"
                    className="flex items-center space-x-4 text-lg text-green"
                  >
                    <Logout className="h-8 w-8 text-green-3" />
                    <span>Logout</span>
                  </button>
                  <MenuBubbles className="inset-x-0 hidden w-full h-sm:block" />
                </div>
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
            <button
              className="mr-5 mt-[5px] flex h-4 w-4 scale-125 items-center active:scale-100 md:fixed md:left-2 md:top-3"
              onClick={() => {
                router.push('/')
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                version="1.1"
                x="0px"
                y="0px"
                viewBox="0 0 78.415 98.02"
                enableBackground="new 0 0 78.415 78.416"
                xmlSpace="preserve"
              >
                <g>
                  <g>
                    <path
                      fill="#003A2F"
                      d="M0,39.208c0,21.654,17.554,39.208,39.208,39.208c21.653,0,39.207-17.554,39.207-39.208S60.861,0,39.208,0    C17.554,0,0,17.554,0,39.208z M24.924,36.816l18.511-18.512c0.66-0.66,1.525-0.99,2.391-0.99s1.731,0.33,2.391,0.99    c1.316,1.319,1.32,3.458,0,4.777L32.088,39.209l16.128,16.125c1.316,1.32,1.316,3.459,0,4.777c-1.32,1.32-3.461,1.32-4.775,0    L24.924,41.598C23.604,40.278,23.604,38.136,24.924,36.816z"
                    />
                  </g>
                </g>
              </svg>
            </button>
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
          <div className="hidden md:block">
            <button
              onClick={handleLogout}
              aria-label="logout"
              className="flex items-center space-x-4 text-lg font-semibold text-green hover:text-white"
            >
              <Logout className="h-6 w-6" />
              <span>Logout</span>
            </button>
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
