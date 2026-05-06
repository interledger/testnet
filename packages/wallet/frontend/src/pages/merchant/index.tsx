import { GetServerSideProps } from 'next'

const MerchantPage = () => null

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/merchant/subscriptions',
      permanent: false
    }
  }
}

export default MerchantPage