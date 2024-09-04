import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'
import { useRouter } from 'next/router'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'

type KYCPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const KYCPage: NextPageWithLayout<PersonalDetailsProps> = ({
  countries
}) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

  return (
    <>
      <h2 className="py-2 text-xl font-semibold text-green dark:text-pink-neon">
        Personal Details
      </h2>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  token: string 
}> = async (ctx) => {
  const countries = await userService.getCountries(ctx.req.headers.cookie)
  return {
    props: {
      countries
    }
  }
}

PersonalDetailsPage.getLayout = function (page) {
  return (
    <AuthLayout image="People">
      <HeaderLogo header="Complete KYC" />
      {page}
    </AuthLayout>
  )
}

export default PersonalDetailsPage
