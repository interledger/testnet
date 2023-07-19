import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Link } from '@/ui/Link'
import Image from 'next/image'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

type LogoutPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const LogoutPage: NextPageWithLayout<LogoutPageProps> = ({ isLoggedOut }) => {
  return (
    <>
      {isLoggedOut ? (
        <>
          <HeaderLogo header="Interledger Testnet" />
          <h2 className="mb-5 mt-10 text-xl font-semibold text-green">
            You have successfully been logged out
          </h2>
          <Image
            className="mt-auto object-cover md:hidden"
            src="/welcome-mobile.webp"
            alt="Logout"
            quality={100}
            width={500}
            height={200}
          />
          <p className="z-10 mt-auto font-extralight text-green">
            Want to login again?{' '}
            <Link href="login" className="font-medium underline">
              Log in
            </Link>
          </p>
        </>
      ) : (
        <>
          <HeaderLogo header="Interledger testnet" />
          <h2 className="mb-5 mt-10 text-xl font-semibold text-green">
            Something went wrong while logging out. Please try again.
          </h2>
        </>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  isLoggedOut: boolean
}> = async () => {
  console.log("LOGOUT")
  const logoutResponse = await userService.logout()

  if (!logoutResponse.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      isLoggedOut: logoutResponse.success
    }
  }
}

LogoutPage.getLayout = function (page) {
  return <AuthLayout image="Park">{page}</AuthLayout>
}

export default LogoutPage
