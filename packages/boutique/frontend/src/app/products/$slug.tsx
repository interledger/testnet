import { BirdError } from '@/components/bird.tsx'
import { useProductQuery } from '@/hooks/use-product-query.ts'
import { Product } from '@/hooks/use-products-query.ts'
import { IMAGES_URL } from '@/lib/constants.ts'
import { formatPrice } from '@/lib/utils.ts'
import { createContext } from 'react'
import { Link } from 'react-router-dom'
import { ProductCTA } from './components/product-cta.tsx'
import { ProductShimmer } from './components/product-shimmer.tsx'
import { useThemeContext } from '@/lib/theme.ts'

interface ProductContextValue {
  product: Product
}

export const ProductContext = createContext<ProductContextValue>(
  {} as ProductContextValue
)

export function Component() {
  const { data, error } = useProductQuery()
  const { theme } = useThemeContext()

  if (error) {
    return (
      <div className="col-span-4 mt-4 text-center">
        <BirdError className="mx-auto h-20 w-20" />
        <p className="text-lg font-['DejaVuSansMonoBold']">
          Something went wrong...
        </p>
        <p>{error.message}</p>
        <Link
          to="/products"
          className="mt-2 text-lg hover:underline dark:hover:no-underline dark:hover:shadow-glow-link"
        >
          Go back to products page
        </Link>
      </div>
    )
  }

  if (data) {
    return (
      <ProductContext.Provider value={{ product: data.result }}>
        <div className="lg:grid lg:grid-cols-3 lg:gap-x-12">
          <div className="aspect-h-1 aspect-w-1 mx-auto h-80 w-80 overflow-hidden rounded-md bg-green-light dark:bg-purple-dark lg:w-full">
            <img
              src={`${IMAGES_URL}${theme === 'light' ? data.result.image : data.result.imageDark}`}
              alt={data.result.name}
              className="h-full w-full object-scale-down object-center"
            />
          </div>

          <div className="col-span-2 mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-['DejaVuSansMonoBold'] tracking-tight">
              {data.result.name}
            </h1>
            <div className="mt-3">
              <p className="text-3xl tracking-tight">
                {formatPrice(data.result.price)}
              </p>
            </div>
            <div className="prose mt-6 max-w-full">
              <blockquote
                className="quote space-y-6"
                dangerouslySetInnerHTML={{ __html: data.result.description }}
              />
            </div>
            <ProductCTA />
          </div>
        </div>
      </ProductContext.Provider>
    )
  }

  return <ProductShimmer />
}
