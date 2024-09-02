import { ReactNode } from 'react'
import { BackButton } from './BackButton'

type PageHeaderProps = {
  title: string
  message?: ReactNode
}

export const PageHeader = ({ title, message }: PageHeaderProps) => {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold md:text-4xl">{title}</h1>
      </div>
      <p className="leading-[1.39]">{message}</p>
    </header>
  )
}
