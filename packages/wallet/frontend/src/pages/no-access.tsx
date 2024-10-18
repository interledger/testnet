import Link from 'next/link'
import Image from 'next/image'
import { THEME } from '@/utils/constants'

const NoAccessPage = () => {
  const imageName =
    THEME === 'dark' ? '/bird-error-dark.webp' : '/bird-error-light.webp'

  return (
    <div className="bg-green-light dark:bg-purple flex h-full w-screen flex-col items-center justify-center text-center text-2xl font-semibold">
      <h1>Access to the given resource is forbidden.</h1>
      <Link
        href="/"
        className="dark:hover:text-pink-neon mt-5 text-xl font-semibold underline hover:text-green"
      >
        Go to home page
      </Link>
      <Image
        className="mt-10 object-cover"
        src={imageName}
        alt="Error"
        quality={100}
        width={500}
        height={200}
      />
    </div>
  )
}

export default NoAccessPage
