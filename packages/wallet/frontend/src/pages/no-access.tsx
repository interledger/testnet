import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'

const NoAccessPage = () => {
  const theme = useTheme()
  const imageName =
    theme.theme === 'dark' ? '/bird-error-dark.webp' : '/bird-error-light.webp'

  return (
    <div className="flex h-full flex-col items-center justify-center bg-turqoise text-center text-2xl font-semibold text-white">
      <h1>Access to the given resource is forbidden.</h1>
      <Link
        href="/"
        className="mt-5 text-xl font-semibold text-white underline"
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
