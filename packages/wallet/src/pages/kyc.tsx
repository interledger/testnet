import { HeaderLogo } from '@/components/HeaderLogo'
import { KYCTabs } from '@/components/kyc/KYCTabs'
import AuthLayout from '@/components/layouts/AuthLayout'
import Image from 'next/image'

const Kyc = () => {
  return (
    <AuthLayout image="Group" background="brand-green-5">
      <HeaderLogo header="Complete KYC" type="kyc" />
      <KYCTabs />
      <Image
        className="mt-auto object-cover md:hidden"
        src="/login-mobile.webp"
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
    </AuthLayout>
  )
}

export default Kyc
