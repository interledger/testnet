import { useProductsQuery } from '@/hooks/useProductsQuery.ts'
import { ProductCard } from './product-card'
import { ProductCardShimmer } from './product-card-shimmer.tsx'
import { cn } from '@/lib/utils.ts'
import { queryClient } from '@/app/query-client.ts'
import { BirdError } from '@/components/icons.tsx'

const ProductsListWrapper = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'mt-10 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
      {...props}
    />
  )
}

export const ProductsList = () => {
  const products = useProductsQuery()

  if (products.data) {
    return (
      <ProductsListWrapper>
        {products.data.data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductsListWrapper>
    )
  }

  if (products.error) {
    return (
      <div className="col-span-4 mt-4 text-center">
        <BirdError className="mx-auto h-20 w-20" />
        <p className="text-lg font-bold">Something went wrong ...</p>
        <p>We are working on fixing this problem.</p>
        <p>If the issue persists, do not hesitate to contact us.</p>
        <p>Please try again.</p>
        <button
          className="mt-2 text-lg text-green-6 hover:text-green-3"
          onClick={() => queryClient.invalidateQueries(['products'])}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      {Array.from({ length: 6 }, (_, key) => (
        <ProductCardShimmer key={key} />
      ))}
    </>
  )
}
