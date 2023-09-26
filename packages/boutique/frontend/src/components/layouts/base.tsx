import { Header } from '@/components/header.tsx'
import { Outlet } from 'react-router-dom'

export const BaseLayout = () => {
  return (
    <div className="flex h-screen flex-col text-green">
      <Header />
      <div className="py-10">
        <main>
          <div className="mx-auto max-w-[90rem] px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
