import { Link } from '@/ui/Link'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'
import { Info } from './icons/Info'
import { IconButton } from '@/ui/IconButton'
import { useOnboardingContext } from '@/lib/context/onboarding'

const tabs = [
  {
    name: 'Account',
    href: '/settings'
  },
  {
    name: 'Developer Keys',
    href: '/settings/developer-keys'
  }
]

export const SettingsTabs = () => {
  const { pathname } = useRouter()
  const { setRunOnboarding, setStepIndex, setIsDevKeysOnboarding } =
    useOnboardingContext()

  return (
    <div className="flex w-full flex-col space-y-5 md:max-w-lg">
      <div className="my-5 flex justify-center space-x-10 p-1 sm:justify-between">
        {tabs.map((tab) => (
          <div key={tab.name} className="flex items-center justify-center">
            <Link
              key={tab.name}
              href={tab.href}
              className={cx(
                'group relative py-2.5 text-center text-lg font-medium leading-5 sm:px-10',
                pathname === tab.href
                  ? 'text-green'
                  : 'text-green-3 hover:text-green'
              )}
            >
              <>
                {tab.name}
                <div
                  className={cx(
                    'absolute inset-x-0 bottom-0 h-1 rounded-full',
                    pathname === tab.href
                      ? 'bg-green'
                      : 'bg-gradient-primary group-hover:bg-gradient-to-r group-hover:from-green group-hover:to-green'
                  )}
                />
              </>
            </Link>
            {pathname === tab.href && tab.name === 'Developer Keys' ? (
              <IconButton
                aria-label="info-dev-keys"
                className="ml-2 text-green hover:text-black dark:text-pink-neon dark:hover:text-white"
                id="devKeysInfo"
                onClick={() => {
                  setIsDevKeysOnboarding(true)
                  setStepIndex(24)
                  setRunOnboarding(true)
                }}
              >
                <Info />
              </IconButton>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
