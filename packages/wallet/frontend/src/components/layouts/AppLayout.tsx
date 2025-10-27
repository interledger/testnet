import { ReactNode, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { Bubbles } from '@/ui/Bubbles'
import dynamic from 'next/dynamic'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { Toaster } from '@/components/toast/Toaster'
import { FEATURES_ENABLED } from '@/utils/constants'
const Onboarding = dynamic(() => import('@/components/onboarding/Onboarding'), {
  ssr: false
})

type AppLayoutProps = {
  children: ReactNode
  isCardsVisible?: boolean
}

export const AppLayout = ({ children, isCardsVisible }: AppLayoutProps) => {
  const { isUserFirstTime, setIsUserFirstTime, isDevKeysOnboarding } =
    useOnboardingContext()

  const showCardsMenu =
    isCardsVisible === undefined
      ? false
      : FEATURES_ENABLED
        ? true
        : isCardsVisible
  useEffect(() => {
    setIsUserFirstTime(
      false
      // ToDo back to the drawing board for the Onboarding, because all of the changes with GateHub, disable for now
      // window.localStorage.getItem('isUserFirstTimeOnTestnet') === 'true'
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Menu isCardsVisible={showCardsMenu} />
      {(isUserFirstTime || isDevKeysOnboarding) && <Onboarding />}

      <main className="mt-[84px] min-w-0 px-8 py-7 md:mt-0 md:px-16 md:py-12 md:[grid-column:2/3] h-full">
        {children}
        <Toaster />
        <Bubbles className="pointer-events-none fixed inset-y-0 right-0 hidden h-full lg:block" />
      </main>
    </>
  )
}
