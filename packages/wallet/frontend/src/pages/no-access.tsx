import Link from 'next/link'
import Image from 'next/image'

const NoAccessPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-turqoise text-center text-2xl font-semibold text-white">
      <h1>
        You are trying to access a page for a payment pointer that&apos;s not
        yours.
      </h1>
      <div>
        Verify the payment pointer, or login with a new account that has access
        to the payment pointer.
      </div>
      <Link
        href="/"
        className="mt-5 text-xl font-semibold text-white underline"
      >
        Go to home page
      </Link>
      <Image
        className="mt-10 object-cover"
        src="/bird-error.webp"
        alt="No access to grant"
        quality={100}
        width={500}
        height={200}
      />
    </div>
  )
}

export default NoAccessPage
