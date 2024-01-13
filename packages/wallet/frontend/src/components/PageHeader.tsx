import { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BackButton } from './BackButton'

type PageHeaderProps = {
  title: string
  message?: ReactNode
}

export const PageHeader = ({ title, message }: PageHeaderProps) => {
  const pathname = usePathname()
  return (
    <div className="flex items-center">
      {pathname !== '/' && <BackButton />}
      <div className="text-turqoise">
        <h1 className="text-2xl font-semibold md:text-4xl">{title}</h1>
        <p className="text-lg font-light md:text-lg">{message}</p>
      </div>
    </div>
  )
}
