import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-60">
        <main className="flex-1">
          <div className="py-12">
            <div className="mx-auto max-w-7xl px-14">{children}</div>
          </div>
        </main>
      </div>
    </>
  )
}
