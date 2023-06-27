import { ReactNode, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { Bubbles } from '@/ui/Bubbles'
import dynamic from 'next/dynamic'
import { useOnboardingContext } from '@/lib/context/onboarding'
const Onboarding = dynamic(() => import('@/components/onboarding/Onboarding'), {
  ssr: false
})

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isUserFirstTime, setIsUserFirstTime } = useOnboardingContext()

  useEffect(() => {
    setIsUserFirstTime(
      true
      // window.localStorage.getItem('isUserFirstTimeOnTestnet') === 'true'
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Menu />
      {isUserFirstTime && <Onboarding />}
      <div className="flex flex-1 flex-col pt-20 md:pl-60 md:pt-0">
        <main className="flex-1">
          <div className="py-7 md:py-10">
            <div className="mx-auto max-w-7xl px-7 md:px-20">{children}</div>
          </div>
        </main>
        <Bubbles className="fixed inset-y-0 right-0 hidden h-full lg:block" />
      </div>
    </>
  )
}
