import { HeaderLogo } from '@/components/HeaderLogo'
import { KYC } from '@/components/kyc'
import AuthLayout from '@/components/layouts/AuthLayout'
import { NextPageWithLayout } from '@/lib/types/app'

const KYCPage: NextPageWithLayout = () => {
  return (
    <>
      <HeaderLogo header="Complete KYC" type="kyc" />
      <KYC />
    </>
  )
}

KYCPage.getLayout = function (page) {
  return (
    <AuthLayout image="Group" background="green">
      {page}
    </AuthLayout>
  )
}

export default KYCPage
