import { userService } from '@/lib/api/user'
import { Link } from '@/ui/Link'
import { Logo } from '@/ui/Logo'
import { Dialog, Transition } from '@headlessui/react'
import { useRouter } from 'next/router'
import { Fragment, type SVGProps, useState } from 'react'
import { Bars } from './icons/Bars'
import { Cog } from './icons/Cog'
import { Grant } from './icons/Grant'
import { Home } from './icons/Home'
import { Logout } from './icons/Logout'
import { X } from './icons/X'
import { Transactions } from './icons/Transactions'
import { SendMenu } from './icons/Send'
import { RequestMenu } from './icons/Request'
import { cn } from '@/utils/helpers'

type MenuItemProps = {
  name: string
  href: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

const menuItems: MenuItemProps[] = [
  {
    name: 'Accounts',
    href: '/',
    Icon: Home
  },
  {
    name: 'Send',
    href: '/send',
    Icon: SendMenu
  },
  {
    name: 'Request',
    href: '/request',
    Icon: RequestMenu
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
    Icon: Cog
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
      <Transition.Root show={sidebarIsOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-20 md:hidden"
          onClose={setSidebarIsOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="bg-green-modal/30 dark:bg-[#000000]/75 fixed inset-0" />
          </Transition.Child>
          <div className="fixed inset-y-0 right-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative flex flex-col p-6 bg-white dark:bg-purple">
                <button
                  className="block self-end cursor-pointer border-none px-1 mb-4"
                  type="button"
                  onClick={() => setSidebarIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
                <nav className="space-y-4">
                  {menuItems.map(({ name, href, Icon }) => (
                    <Link
                      key={name}
                      href={href}
                      onClick={() => setSidebarIsOpen(false)}
                      className={cn(
                        'group flex items-center p-2 gap-x-4 rounded-md border border-transparent focus:border-black dark:focus:shadow-glow-link dark:focus:border-white',
                        pathname === href
                          ? 'bg-green-light dark:bg-purple-dark'
                          : null
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          pathname === href
                            ? 'dark:drop-shadow-glow-svg'
                            : 'dark:group-hover:drop-shadow-glow-svg dark:group-focus:drop-shadow-glow-svg'
                        )}
                      />
                      <span className="group-hover:scale-110 transition-transform origin-[center_left] duration-200 ease-in-out group-focus:scale-110">
                        {name}
                      </span>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto space-y-5 pl-8 pr-5">
                  <button
                    onClick={handleLogout}
                    aria-label="logout"
                    className="flex items-center space-x-4 text-lg text-green"
                  >
                    <Logout className="text-green-3 h-8 w-8" />
                    <span>Logout</span>
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <header className="block md:hidden top-0 bg-white dark:bg-purple fixed px-6 border-b-2 border-dotted inset-x-0 h-[84px]">
        <nav className="flex items-center justify-between">
          <Link className="" href="/">
            <Logo className="text-black dark:text-white w-48 py-4 transition-[transform,fill,color] duration-200" />
          </Link>
          <button
            className="p-1"
            aria-label="open menu"
            onClick={() => setSidebarIsOpen(true)}
          >
            <Bars className="stroke-black dark:stroke-white h-7 w-7" />
          </button>
        </nav>
      </header>

      <aside className="hidden md:block relative w-max">
        <nav className="sticky top-0 flex h-screen flex-col p-6">
          <Link
            className="p-2 mb-4 rounded-md border border-transparent group focus:border-black dark:focus:border-white dark:focus:shadow-glow-link"
            href="/"
          >
            <Logo className="text-black dark:text-white w-48 py-4 dark:group-hover:scale-100 group-hover:scale-105 transition-transform dark:group-focus:scale-100 group-focus:scale-105 duration-200 dark:group-hover:drop-shadow-glow-svg dark:group-focus:drop-shadow-glow-svg" />
          </Link>
          <div className="w-full flex-1 space-y-4">
            {menuItems.map(({ name, href, Icon }) => (
              <Link
                key={name}
                href={href}
                onClick={() => setSidebarIsOpen(false)}
                className={cn(
                  'group flex items-center p-2 gap-x-4 rounded-md border border-transparent focus:border-black dark:focus:shadow-glow-link dark:focus:border-white',
                  pathname === href
                    ? 'bg-green-light dark:bg-purple-dark'
                    : null
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    pathname === href
                      ? 'dark:drop-shadow-glow-svg'
                      : 'dark:group-hover:drop-shadow-glow-svg dark:group-focus:drop-shadow-glow-svg'
                  )}
                />
                <span className="group-hover:scale-110 transition-transform origin-[center_left] duration-200 ease-in-out group-focus:scale-110">
                  {name}
                </span>
              </Link>
            ))}
          </div>
          <button
            aria-label="logout"
            onClick={handleLogout}
            className="group flex items-center p-2 gap-x-4 rounded-md border border-transparent focus:border-black dark:focus:shadow-glow-link dark:focus:border-white"
          >
            <Logout className="h-6 w-6 dark:group-hover:drop-shadow-glow-svg dark:group-focus:drop-shadow-glow-svg" />
            <span className="group-hover:scale-110 transition-transform origin-[center_left] duration-200 ease-in-out group-focus:scale-110">
              Logout
            </span>
          </button>
        </nav>
      </aside>
      {/* Desktop Menu - END*/}
    </>
  )
}
