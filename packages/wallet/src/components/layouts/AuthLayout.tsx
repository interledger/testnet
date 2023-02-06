import Image from 'next/image'
import { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <>
      <div className="h-full">
        <div className="flex min-h-full">
          <div className="relative hidden w-0 flex-1 md:block">
            <Image
              fill
              className="object-cover"
              src="/park.webp"
              alt="Park"
              quality={100}
            />
          </div>
          <div className="min-h-full flex-1 bg-brand-blue/70 py-10 sm:py-24">
            <div className="mx-auto flex min-h-full w-full flex-col items-center sm:px-6 lg:px-20 xl:px-24">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthLayout
