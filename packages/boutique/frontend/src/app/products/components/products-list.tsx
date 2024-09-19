import { useProductsQuery } from '@/hooks/use-products-query.ts'
import { ProductCard } from './product-card'
import { ProductCardShimmer } from './product-card-shimmer.tsx'
import { cn } from '@/lib/utils.ts'
import { queryClient } from '@/app/query-client.ts'
import { BirdError } from '@/components/bird.tsx'

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
        {products.data.result.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductsListWrapper>
    )
  }

  if (products.error) {
    return (
      <div className="col-span-4 mt-4 text-center">
        <BirdError className="mx-auto h-20 w-20" />
        <p className="text-lg font-['DejaVuSansMonoBold']">
          Something went wrong...
        </p>
        <p>We are working on fixing this problem.</p>
        <p>If the issue persists, do not hesitate to contact us.</p>
        <p>Please try again.</p>
        <button
          className="mt-2 text-lg hover:underline dark:hover:no-underline dark:hover:shadow-glow-link"
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: ['products'],
              exact: true
            })
          }
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <ProductsListWrapper>
        {Array.from({ length: 6 }, (_, key) => (
          <ProductCardShimmer key={key} />
        ))}
      </ProductsListWrapper>
    </>
  )
}
