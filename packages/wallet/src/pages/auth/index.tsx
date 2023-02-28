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
      <h2 className="mt-5 mb-10 text-xl font-light text-green md:mt-20">
        Already a customer?
      </h2>
      <Button aria-label="log in" href="auth/login">
        Log in
      </Button>
      <Divider content="or" />
      <h2 className="mb-5 text-xl font-semibold text-green">New here?</h2>
      <Button aria-label="sign up" href="auth/signup">
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
      <p className="mt-auto font-extralight text-green">
        About{' '}
        <Link href="https://interledger.org" className="font-medium underline">
          Interledger
        </Link>
      </p>
    </AuthLayout>
  )
}
