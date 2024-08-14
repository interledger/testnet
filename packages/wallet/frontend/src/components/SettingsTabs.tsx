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
                  ? 'bg-green-light dark:bg-purple-dark hover:outline hover:outline-1 hover:outline-black hover:dark:outline-none hover:dark:shadow-glow-button focus:outline focus:outline-1 focus:outline-black focus:dark:outline-none focus:dark:shadow-glow-button'
                  : 'hover:bg-green-light hover:dark:bg-purple-dark hover:outline hover:outline-1 hover:outline-black hover:dark:outline-none hover:dark:shadow-glow-button '
              )}
            >
              <>
                {tab.name}
                <div className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-black dark:bg-white" />
              </>
            </Link>
            {pathname === tab.href && tab.name === 'Developer Keys' ? (
              <IconButton
                aria-label="info-dev-keys"
                className="ml-2 text-green hover:text-black dark:text-pink-neon dark:hover:drop-shadow-glow-svg dark:hover:text-pink-light"
                id="devKeysInfo"
                onClick={() => {
                  setIsDevKeysOnboarding(true)
                  setStepIndex(26)
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
