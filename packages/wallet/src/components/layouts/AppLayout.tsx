import { ReactNode } from 'react'
import Sidebar from '../Sidebar/index'

type AppLayoutProps = {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Sidebar />
      {children}
    </>
  )
}
