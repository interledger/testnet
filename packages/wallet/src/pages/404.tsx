import Link from 'next/link'
import Image from 'next/image'

const NotFoundPage = () => {
  return (
    <div className="h-fulls flex h-full flex-col items-center justify-center bg-brand-turqoise text-center text-2xl font-semibold text-white">
      <h1>404 - Page Not Found</h1>
      <div>Sorry, this page does not exist.</div>
      <Link href="/" className="text-xl font-semibold text-white underline">
        Go to account Home page
      </Link>
      <Image
        className="mt-10 object-cover"
        src="/login-mobile.webp"
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
    </div>
  )
}

export default NotFoundPage
