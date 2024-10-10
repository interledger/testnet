import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { Divider } from '@/ui/Divider'
import { Link } from '@/ui/Link'
import { THEME } from '@/utils/constants'
import Image from 'next/image'

const WelcomePage: NextPageWithLayout = () => {
  const imageName =
    THEME === 'dark' ? '/bird-envelope-dark.webp' : '/bird-envelope-light.webp'

  return (
    <>
      <HeaderLogo header="Welcome" />
      <h2 className="mb-10 mt-5 text-xl font-light text-green dark:text-teal-neon md:mt-20">
        Already a customer?
      </h2>
      <Button aria-label="log in" href="auth/login">
        Log in
      </Button>
      <Divider content="or" />
      <h2 className="mb-5 text-xl font-semibold text-green dark:text-teal-neon">
        New here?
      </h2>
      <Button aria-label="sign up" href="auth/signup">
        Create account
      </Button>
      <Image
        className="mt-auto object-cover md:hidden"
        src={imageName}
        alt="Welcome"
        quality={100}
        width={400}
        height={200}
      />
      <p className="mt-auto font-extralight text-green dark:text-green-neon">
        About{' '}
        <Link href="https://interledger.org" className="font-medium underline">
          Interledger
        </Link>
      </p>
    </>
  )
}

WelcomePage.getLayout = function (page) {
  return <AuthLayout image="Park">{page}</AuthLayout>
}

export default WelcomePage
