import { useProductsQuery } from '@/hooks/useProductsQuery.ts'
import { ProductCard } from './product-card'
import { ProductCardShimmer } from './product-card-shimmer.tsx'
import { cn } from '@/lib/utils.ts'

const ProductsListWrapper = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'mt-10 grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8',
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

  // TODO: Add error state - this is temporary
  if (products.error) {
    return (
      <div className="col-span-4 text-center text-lg">
        An error has occurred:
        <br />
        <span className="text-red-500">{products.error.message}</span>
      </div>
    )
  }

  return Array.from({ length: 6 }, (_, key) => <ProductCardShimmer key={key} />)
}
