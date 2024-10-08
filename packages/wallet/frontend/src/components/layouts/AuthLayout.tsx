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
            className="object-right md:object-cover lg:object-fill"
            src={imageSrc}
            alt={image}
            quality={100}
            priority={true}
            loading="eager"
          />
        </div>
        <div className="min-h-full flex-1">
          <div className="mx-auto flex h-screen w-full flex-col items-center px-2">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthLayout
