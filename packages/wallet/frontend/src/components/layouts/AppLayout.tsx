import { ReactNode, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { Bubbles } from '@/ui/Bubbles'
import dynamic from 'next/dynamic'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { Toaster } from '@/components/toast/Toaster'
const Onboarding = dynamic(() => import('@/components/onboarding/Onboarding'), {
  ssr: false
})

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isUserFirstTime, setIsUserFirstTime, isDevKeysOnboarding } =
    useOnboardingContext()

  useEffect(() => {
    setIsUserFirstTime(
      window.localStorage.getItem('isUserFirstTimeOnTestnet') === 'true'
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Menu />
      {(isUserFirstTime || isDevKeysOnboarding) && <Onboarding />}

      <main className="mt-[84px] min-w-0 px-8 py-7 md:mt-0 md:px-16 md:py-12 md:[grid-column:2/3] h-full">
        {children}
        <Toaster />
        <Bubbles className="pointer-events-none fixed inset-y-0 right-0 hidden h-full lg:block" />
      </main>
    </>
  )
}
