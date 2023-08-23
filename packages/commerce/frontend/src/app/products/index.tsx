import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from '@/components/page-header.tsx'
import { ProductsList } from './components/products-list.tsx'

export function Component() {
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Interledger E-Commerce</PageHeaderHeading>
        <PageHeaderDescription>
          Value or feeling? Explore all here!
        </PageHeaderDescription>
      </PageHeader>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        <ProductsList />
      </div>
    </>
  )
}
