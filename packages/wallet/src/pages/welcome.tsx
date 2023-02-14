import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Button } from '@/ui/Button'
import { Divider } from '@/ui/Divider'
import { Link } from '@/ui/Link'
import Image from 'next/image'

export default function Welcome() {
  return (
    <AuthLayout image="Park">
      <HeaderLogo header="Welcome" />
      <h2 className="mt-5 mb-10 text-xl font-light text-brand-green-4 md:mt-20">
        Already a customer?
      </h2>
      <Button aria-label="log in" href="/login">
        Log in
      </Button>
      <Divider content="or" />
      <h2 className="mb-5 text-xl font-semibold text-brand-green-4">
        New here?
      </h2>
      <Button aria-label="sign up" href="register">
        Create account
      </Button>
      <Image
        className="mt-auto object-cover md:hidden"
        src="/welcome-mobile.webp"
        alt="Welcome"
        quality={100}
        width={400}
        height={200}
      />
      <Link
        href="https://interledger.org"
        className="mt-auto text-sm font-extralight text-brand-green-4"
      >
        About Interledger
      </Link>
    </AuthLayout>
  )
}
