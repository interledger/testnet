import { useProductQuery } from '@/hooks/use-product-query.ts'
import { IMAGES_URL } from '@/lib/constants.ts'
import { formatPrice } from '@/lib/utils.ts'
import { ProductCTA } from './components/product-cta.tsx'
import { Product } from '@/hooks/use-products-query.ts'
import { createContext } from 'react'

interface ProductContextValue {
  product: Product
}

export const ProductContext = createContext<ProductContextValue>(
  {} as ProductContextValue
)

export function Component() {
  const { data } = useProductQuery()

  if (data) {
    return (
      <ProductContext.Provider value={{ product: data.data }}>
        <div className="lg:grid lg:grid-cols-3 lg:gap-x-12">
          <div className="aspect-h-1 aspect-w-1 mx-auto h-80 w-80 overflow-hidden rounded-md bg-gray-50  lg:w-full">
            <img
              src={`${IMAGES_URL}${data.data.image}`}
              alt={data.data.name}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="col-span-2 mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight">
              {data.data.name}
            </h1>
            <div className="mt-3">
              <p className="text-3xl tracking-tight">
                {formatPrice(data.data.price)}
              </p>
            </div>
            <div className="prose mt-6 max-w-full">
              <blockquote
                className="quote space-y-6"
                dangerouslySetInnerHTML={{ __html: data.data.description }}
              />
            </div>
            <ProductCTA />
          </div>
        </div>
      </ProductContext.Provider>
    )
  }
}
