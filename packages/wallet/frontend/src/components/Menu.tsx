import { userService } from '@/lib/api/user'
import { Link } from '@/ui/Link'
import { Logo, LogoWallet } from '@/ui/Logo'
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { useRouter } from 'next/router'
import {
  Fragment,
  type SVGProps,
  ComponentPropsWithRef,
  ReactNode
} from 'react'
import { Bars } from './icons/Bars'
import { Cog } from './icons/Cog'
import { Grant } from './icons/Grant'
import { Home } from './icons/Home'
import { Logout } from './icons/Logout'
import { X } from './icons/X'
import { Transactions } from './icons/Transactions'
import { Send } from './icons/Send'
import { Request } from './icons/Request'
import { cn } from '@/utils/helpers'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useMenuContext } from '@/lib/context/menu'
import { Card } from './icons/CardButtons'
import { FEATURES_ENABLED } from '@/utils/constants'

type MenuItemProps = {
  name: string
  href: string
  id: string
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

export const menuItems: MenuItemProps[] = [
  {
    name: 'Accounts',
    href: '/',
    id: 'home',
    Icon: Home
  },
  {
    name: 'Send',
    href: '/send',
    id: 'send',
    Icon: Send
  },
  {
    name: 'Request',
    href: '/request',
    id: 'request',
    Icon: Request
  },
  {
    name: 'Transactions',
    href: '/transactions',
    id: 'transactions',
    Icon: Transactions
  },
  {
    name: 'Grants',
    href: '/grants',
    id: 'grants',
    Icon: Grant
  },
  {
    name: 'Settings',
    href: '/settings',
    id: 'settings',
    Icon: Cog
  }
]

if (FEATURES_ENABLED) {
  const lastItem = menuItems.pop() as MenuItemProps
  menuItems.push({
    name: 'Card',
    href: '/card',
    id: 'card',
    Icon: Card
  })
  menuItems.push(lastItem)
}

interface NavLinkProps extends ComponentPropsWithRef<'a'> {
  currentPath: string
  id: string
  children: ReactNode
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

const NavLink = ({
  href,
  currentPath,
  className,
  children,
  id,
  Icon
}: NavLinkProps) => {
  const { isUserFirstTime, setRunOnboarding } = useOnboardingContext()
  const { setSidebarIsOpen } = useMenuContext()

  return (
    <Link
      href={href}
      id={id}
      onClick={() => {
        setSidebarIsOpen(false)
        if (
          (id.indexOf('send') !== -1 || id.indexOf('request') !== -1) &&
          isUserFirstTime
        ) {
          setRunOnboarding(false)
        }
      }}
      className={cn(
        'group flex items-center gap-x-4 rounded-md border border-transparent p-2 focus:border-black dark:focus:border-white dark:focus:shadow-glow-link',
        currentPath === href ? 'bg-green-light dark:bg-purple-dark' : null,
        className
      )}
    >
      <Icon
        className={cn(
          'h-6 w-6',
          currentPath === href
            ? 'dark:drop-shadow-glow-svg'
            : 'dark:group-hover:drop-shadow-glow-svg dark:group-focus:drop-shadow-glow-svg'
        )}
      />
      <span className="origin-[center_left] transition-transform duration-200 ease-in-out group-hover:scale-110 group-focus:scale-110">
        {children}
      </span>
    </Link>
  )
}

const LogoutButton = () => {
  const router = useRouter()

  const handleLogout = async () => {
    const res = await userService.logout()
    if (res.success) {
      router.push('/auth')
    }
  }

  return (
    <button
      aria-label="logout"
      onClick={handleLogout}
      className="group mt-auto flex items-center gap-x-4 rounded-md border border-transparent p-2 focus:border-black dark:focus:border-white dark:focus:shadow-glow-link"
    >
      <Logout className="h-6 w-6 dark:group-hover:drop-shadow-glow-svg dark:group-focus:drop-shadow-glow-svg" />
      <span className="origin-[center_left] transition-transform duration-200 ease-in-out group-hover:scale-110 group-focus:scale-110">
        Logout
      </span>
    </button>
  )
}

export const Menu = () => {
  const router = useRouter()
  const pathname = `/${router.pathname.split('/')?.slice(1)[0] ?? ''}`
  const { sidebarIsOpen, setSidebarIsOpen } = useMenuContext()
  const { isUserFirstTime, stepIndex, setRunOnboarding } =
    useOnboardingContext()

  return (
    <>
      <Transition
        show={sidebarIsOpen}
        as={Fragment}
        afterEnter={() => {
          if (isUserFirstTime && stepIndex === 8) {
            setRunOnboarding(true)
          }
        }}
      >
        <Dialog
          as="div"
          className="relative z-20 md:hidden"
          onClose={setSidebarIsOpen}
        >
          <TransitionChild
            as={Fragment}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-green-modal/30 dark:bg-[#000000]/75" />
          </TransitionChild>
          <div className="fixed inset-y-0 right-0 flex">
            <TransitionChild
              as={Fragment}
              enter="transform transition duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <DialogPanel className="relative flex flex-col bg-white p-6 dark:bg-purple">
                <button
                  className="mb-4 block cursor-pointer self-end border-none px-1"
                  type="button"
                  onClick={() => setSidebarIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
                <nav className="space-y-4">
                  {menuItems.map(({ name, href, id, Icon }) => (
                    <NavLink
                      currentPath={pathname}
                      key={name}
                      href={href}
                      Icon={Icon}
                      id={`mobile_${id}`}
                    >
                      {name}
                    </NavLink>
                  ))}
                </nav>
                <LogoutButton />
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>

      <header className="fixed z-50 inset-x-0 top-0 block h-[84px] border-b-2 border-dotted bg-white px-6 dark:bg-purple md:hidden">
        <nav className="flex items-center justify-between">
          <Link className="" href="/">
            {FEATURES_ENABLED ? (
              <LogoWallet className="w-48 py-4 text-black transition-[transform,fill,color] duration-200 dark:text-white" />
            ) : (
              <Logo className="w-48 py-4 text-black transition-[transform,fill,color] duration-200 dark:text-white" />
            )}
          </Link>
          <button
            className="p-1"
            aria-label="open menu"
            onClick={() => setSidebarIsOpen(true)}
          >
            <Bars className="h-7 w-7 stroke-black dark:stroke-white" />
          </button>
        </nav>
      </header>

      <aside className="relative hidden w-max md:block">
        <nav className="sticky top-0 flex h-screen flex-col p-6">
          <Link
            className="group mb-4 rounded-md border border-transparent p-2 focus:border-black dark:focus:border-white dark:focus:shadow-glow-link"
            href="/"
          >
            {FEATURES_ENABLED ? (
              <LogoWallet className="w-48 py-4 text-black transition-transform duration-200 group-hover:scale-105 group-focus:scale-105 dark:text-white dark:group-hover:scale-100 dark:group-hover:drop-shadow-glow-svg dark:group-focus:scale-100 dark:group-focus:drop-shadow-glow-svg" />
            ) : (
              <Logo className="w-48 py-4 text-black transition-transform duration-200 group-hover:scale-105 group-focus:scale-105 dark:text-white dark:group-hover:scale-100 dark:group-hover:drop-shadow-glow-svg dark:group-focus:scale-100 dark:group-focus:drop-shadow-glow-svg" />
            )}
          </Link>
          <div className="w-full space-y-4">
            {menuItems.map(({ name, href, id, Icon }) => (
              <NavLink
                currentPath={pathname}
                key={name}
                href={href}
                Icon={Icon}
                id={id}
              >
                {name}
              </NavLink>
            ))}
          </div>
          <LogoutButton />
        </nav>
      </aside>
    </>
  )
}
