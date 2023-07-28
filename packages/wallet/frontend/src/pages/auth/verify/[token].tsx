import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Link } from '@/ui/Link'
import Image from 'next/image'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { z } from 'zod'
import { userService } from '@/lib/api/user'

type VerifyEmailPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const VerifyEmailPage: NextPageWithLayout<VerifyEmailPageProps> = ({
  verified,
  message
}) => {
  return (
    <>
      <HeaderLogo header="Email verification" />
      {verified ? (
        <>
          <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green">
            Your email has been verified. Continue to login to use Interledger
            Testnet.
          </h2>
          <Button intent="primary" aria-label="login" href="/auth/login">
            Login to your account
          </Button>
        </>
      ) : (
        <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green">
          Email verification unsuccessful: {message}. Please try again.
        </h2>
      )}

      <Image
        className="mt-auto object-cover md:hidden"
        src="/welcome-mobile.webp"
        alt="Verify email"
        quality={100}
        width={400}
        height={200}
      />
      <p className="mt-auto font-extralight text-green">
        Have an account? Continue to{' '}
        <Link href="/auth/login" className="font-medium underline">
          Login
        </Link>
      </p>
    </>
  )
}

const querySchema = z.object({
  token: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  verified: boolean
  message: string
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const verifyEmailResponse = await userService.verifyEmail(result.data)

  return {
    props: {
      verified: verifyEmailResponse.success,
      message: verifyEmailResponse.message
    }
  }
}

VerifyEmailPage.getLayout = function (page) {
  return <AuthLayout image="Park">{page}</AuthLayout>
}

export default VerifyEmailPage
