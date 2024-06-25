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
    <div className="md:grid md:grid-cols-[max-content_1fr] relative">
      <Menu />
      {(isUserFirstTime || isDevKeysOnboarding) && <Onboarding />}

      <main className="mt-[84px] px-8 py-7 md:mt-0 md:px-16 md:py-12 md:[grid-column:2/3]">
        {children}
        <Toaster />
        <Bubbles className="fixed inset-y-0 right-0 hidden h-full lg:block" />
      </main>
    </div>
  )
}
