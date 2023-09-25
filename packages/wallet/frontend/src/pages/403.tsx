import Link from 'next/link'
import Image from 'next/image'

const NotFoundPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-turqoise text-center text-2xl font-semibold text-white">
      <h1>
        You are trying to acces a page for a payment pointer that&apos;s not
        yours.
      </h1>
      <div>
        Verify the payment pointer, or login with a new account that has access
        to the payment pointer.
      </div>
      <Link href="/" className="text-xl font-semibold text-white underline">
        Go to home page
      </Link>
      <Image
        className="mt-10 object-cover"
        src="/login-mobile.webp"
        alt="You don't have access"
        quality={100}
        width={500}
        height={200}
      />
    </div>
  )
}

export default NotFoundPage
