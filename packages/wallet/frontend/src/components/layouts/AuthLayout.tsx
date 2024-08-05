import { useTheme } from 'next-themes'
import Image from 'next/image'
import { ReactNode } from 'react'

const IMAGES = {
  ParkLight: 'park-light.webp',
  ParkDark: 'park-dark.webp',
  LoginLight: 'login-light.webp',
  LoginDark: 'login-dark.webp',
  RegisterLight: 'register-light.webp',
  RegisterDark: 'register-dark.webp',
  PeopleLight: 'people-light.webp',
  PeopleDark: 'people-dark.webp'
} as const

type Image = keyof typeof IMAGES

type AuthLayoutProps = {
  image: string
  children: ReactNode
}

const AuthLayout = ({ image, children }: AuthLayoutProps) => {
  const theme = useTheme()
  const imageName = theme.theme === 'dark' ? `${image}Dark` : `${image}Light`
  const imageSrc = `/${IMAGES[imageName as Image]}`
  return (
    <>
      <div className="flex min-h-full w-screen">
        <div className="relative hidden w-0 flex-1 md:block">
          <Image
            fill
            // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            src={imageSrc}
            alt={image}
            quality={100}
            priority={true}
            loading="eager"
          />
        </div>
        <div className="min-h-full flex-1 py-10">
          <div className="mx-auto flex min-h-full w-full flex-col items-center sm:px-6 lg:px-20 xl:px-24">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthLayout
