import Link from 'next/link'
import Image from 'next/image'
import { THEME } from '@/utils/constants'

const NotFoundPage = () => {
  const imageName =
    THEME === 'dark' ? '/login-mobile-dark.webp' : '/login-mobile-light.webp'

  return (
    <div className="bg-green-light dark:bg-purple flex h-full w-screen flex-col items-center justify-center text-center text-2xl font-semibold">
      <h1>404 - Page Not Found</h1>
      <div>Sorry, this page does not exist.</div>
      <Link
        href="/"
        className="dark:hover:text-pink-neon text-xl font-semibold underline hover:text-green"
      >
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
