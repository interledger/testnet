import { ReactNode, useEffect } from 'react'
import { Menu } from '@/components/Menu'
import { Bubbles } from '@/ui/Bubbles'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useOnboardingContext } from '@/lib/context/onboarding'
import Link from 'next/link'
const Onboarding = dynamic(() => import('@/components/onboarding/Onboarding'), {
  ssr: false
})

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const pathname = usePathname()
  const Path = pathname.split('/');
  let currentPath = '';
  const { isUserFirstTime, setIsUserFirstTime } = useOnboardingContext()

  useEffect(() => {
    setIsUserFirstTime(
      window.localStorage.getItem('isUserFirstTimeOnTestnet') === 'true'
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Menu />
      <div className='fixed top-[84px] left-4 md:fixed md:top-2 md:left-64 flex text-[#003A2F] font-semibold'>
        <Link href="/" className='underline'>Home</Link>
        {
          Path.filter(beta => beta != "").map((alpha, key) => {
            currentPath += `/${alpha}`;
            alpha = alpha.charAt(0).toUpperCase() + alpha.slice(1);
            return (
              <>
                <p className='mx-1 pb-1'>{` > `}</p>
                <Link href={currentPath} className='underline' key={key}>{alpha}</Link>
              </>
            )
          })
        }

      </div>
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
