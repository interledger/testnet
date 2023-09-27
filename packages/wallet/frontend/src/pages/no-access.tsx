import Link from 'next/link'
import Image from 'next/image'

const NoAccessPage = () => {
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
        src="/bird-error.webp"
        alt="Error"
        quality={100}
        width={500}
        height={200}
      />
    </div>
  )
}

export default NoAccessPage
