import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'

const NotFoundPage = () => {
  const theme = useTheme()
  const imageName =
    theme.theme === 'dark'
      ? '/login-mobile-dark.webp'
      : '/login-mobile-light.webp'

  return (
    <div className="flex h-full flex-col items-center justify-center bg-turqoise text-center text-2xl font-semibold text-white">
      <h1>404 - Page Not Found</h1>
      <div>Sorry, this page does not exist.</div>
      <Link href="/" className="text-xl font-semibold text-white underline">
        Go to home page
      </Link>
      <Image
        className="mt-10 object-cover"
        src={imageName}
        alt="Page Not Found"
        quality={100}
        width={500}
        height={200}
      />
    </div>
  )
}

export default NotFoundPage
