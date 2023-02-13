import { HeaderLogo } from '@/components/HeaderLogo'
import { KYCTabs } from '@/components/kyc/KYCTabs'
import AuthLayout from '@/components/layouts/AuthLayout'

const Kyc = () => {
  return (
    <AuthLayout image="Group" background="brand-green-5">
      <HeaderLogo header="Complete KYC" type="kyc" />
      <KYCTabs />
    </AuthLayout>
  )
}

export default Kyc
