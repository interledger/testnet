import { Header } from '@/components/header.tsx'
import { Outlet } from 'react-router-dom'

export const BaseLayout = () => {
  return (
    <div className="flex h-screen select-none flex-col overflow-hidden text-green">
      <Header />
      <Outlet />
    </div>
  )
}
