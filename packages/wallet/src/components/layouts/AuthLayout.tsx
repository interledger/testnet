import Image from 'next/image'
import { ReactNode } from 'react'

const IMAGES = {
  Park: 'park.webp',
  Login: 'login-welcome.webp'
} as const

type Image = keyof typeof IMAGES

type AuthLayoutProps = {
  image: Image
  children: ReactNode
}

const AuthLayout = ({ image, children }: AuthLayoutProps) => {
  const imageSrc = `/${IMAGES[image]}`
  return (
    <>
      <div className="h-full">
        <div className="flex min-h-full">
          <div className="relative hidden w-0 flex-1 bg-brand-blue/70 md:block">
            <Image
              fill
              className="object-cover"
              src={imageSrc}
              alt={image}
              quality={100}
            />
          </div>
          <div className="min-h-full flex-1 bg-brand-blue/70 py-10">
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
