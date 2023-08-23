import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading
} from '@/components/page-header.tsx'
import { useProductsQuery } from '@/hooks/useProductsQuery.ts'
import { ProductCard } from './components/product-card'

export function Component() {
  const { data } = useProductsQuery()

  return (
    <>
      <PageHeader>
        <PageHeaderHeading>Interledger E-Commerce</PageHeaderHeading>
        <PageHeaderDescription>
          Value or feeling? Explore all here!
        </PageHeaderDescription>
      </PageHeader>
      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {!data ? (
          <>It looks like we do not have any products at the moment</>
        ) : null}
        {data?.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}
