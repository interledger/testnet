import { ReactNode } from 'react'
import { Menu } from '@/components/Menu'
import { Bubbles } from '@/ui/Bubbles'

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Menu />
      <div className="flex flex-1 flex-col pt-20 md:pl-60 md:pt-0">
        <main className="flex-1">
          <div className="py-7 md:py-12">
            <div className="mx-auto max-w-7xl px-7 md:px-20">{children}</div>
          </div>
        </main>
        <Bubbles className="fixed inset-y-0 right-0 hidden h-full lg:block" />
      </div>
    </>
  )
}
