import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from '@/components/page-header.tsx'
import { ProductCard } from './components/product-card.tsx'
import { useProductsQuery } from '@/hooks/useProductsQuery.ts'

export function Component() {
  const { data, error } = useProductsQuery()
  console.log(data, error)
  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Interledger E-Commerce</PageHeaderHeading>
        <PageHeaderDescription>
          Value or feeling? Explore all here!
        </PageHeaderDescription>
      </PageHeader>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        <ProductCard
          product={{
            id: 'productid',
            description: 'description',
            name: 'name',
            price: 100,
            image: 'image'
          }}
        />
      </div>
    </>
  )
}
