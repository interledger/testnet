import { Link } from '@/ui/Link'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'

const tabs = [
  {
    name: 'Account',
    href: '/settings'
  },
  {
    name: 'API',
    href: '/settings/api'
  }
]

export const SettingsTabs = () => {
  const { pathname } = useRouter()

  return (
    <div className="flex w-full flex-col space-y-5 md:max-w-lg">
      <div className="my-5 flex justify-between space-x-10 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={cx(
              'group relative px-10 py-2.5 text-center text-lg font-medium leading-5',
              pathname === tab.href
                ? 'text-brand-green-4'
                : 'text-brand-green-3 hover:text-brand-green-4'
            )}
          >
            <>
              {tab.name}
              <div
                className={cx(
                  'absolute inset-x-0 bottom-0 h-1 rounded-full',
                  pathname === tab.href
                    ? 'bg-brand-green-4'
                    : 'bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7] group-hover:from-brand-green-4 group-hover:to-brand-green-4'
                )}
              />
            </>
          </Link>
        ))}
      </div>
    </div>
  )
}
