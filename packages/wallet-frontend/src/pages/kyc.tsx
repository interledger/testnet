import { HeaderLogo } from '@/components/HeaderLogo'
import { KYC } from '@/components/kyc'
import AuthLayout from '@/components/layouts/AuthLayout'

export default function KYCPage() {
  return (
    <AuthLayout image="Group" background="green">
      <HeaderLogo header="Complete KYC" type="kyc" />
      <KYC />
    </AuthLayout>
  )
}
