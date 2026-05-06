import { Link } from '@/ui/Link'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'

const tabs = [
  {
    name: 'Subscriptions',
    href: '/merchant/subscriptions'
  },
  {
    name: 'One-time orders',
    href: '/merchant/orders'
  }
]

export const MerchantTabs = () => {
  const { pathname } = useRouter()

  return (
    <div className="flex w-full flex-col space-y-5">
      <div className="my-5 flex justify-center space-x-10 p-1 sm:justify-start">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={cx(
              'group relative py-2.5 text-center text-lg font-medium leading-5 sm:px-10',
              pathname === tab.href || pathname.startsWith(`${tab.href}/`)
                ? 'bg-green-light dark:bg-purple-dark hover:outline hover:outline-1 hover:outline-black hover:dark:outline-none hover:dark:shadow-glow-button focus:outline focus:outline-1 focus:outline-black focus:dark:outline-none focus:dark:shadow-glow-button'
                : 'hover:bg-green-light hover:dark:bg-purple-dark hover:outline hover:outline-1 hover:outline-black hover:dark:outline-none hover:dark:shadow-glow-button'
            )}
          >
            <>
              {tab.name}
              <div className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-black dark:bg-white" />
            </>
          </Link>
        ))}
      </div>
    </div>
  )
}