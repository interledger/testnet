import { cx } from 'class-variance-authority'
import Image from 'next/image'
import { ReactNode } from 'react'

const IMAGES = {
  Park: 'park.webp',
  Login: 'login-welcome.webp',
  Register: 'register.webp',
  Group: 'group.webp'
} as const

type Image = keyof typeof IMAGES

type AuthLayoutProps = {
  image: Image
  background?: string
  children: ReactNode
}

const AuthLayout = ({ image, background, children }: AuthLayoutProps) => {
  const imageSrc = `/${IMAGES[image]}`
  return (
    <>
      <div className="h-full">
        <div className="flex min-h-full">
          <div
            className={cx(
              'relative hidden w-0 flex-1 md:block',
              background === 'brand-green'
                ? 'bg-brand-green-5/80'
                : 'bg-brand-blue-1/70'
            )}
          >
            <Image
              fill
              className="object-contain"
              src={imageSrc}
              alt={image}
              quality={100}
            />
          </div>
          <div
            className={cx(
              'min-h-full flex-1 py-10',
              background === 'brand-green'
                ? 'bg-brand-green-5/80'
                : 'bg-brand-blue-1/70'
            )}
          >
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
