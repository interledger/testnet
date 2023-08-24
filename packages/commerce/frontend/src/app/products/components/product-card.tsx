import { ArrowRightLong } from '@/components/icons.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card.tsx'
import type { Product } from '@/hooks/useProductsQuery.ts'
import { IMAGES_URL } from '@/lib/constants.ts'
import { formatPrice } from '@/lib/utils.ts'
import { Link } from 'react-router-dom'

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { name, price, image, slug } = product
  const imageUrl = `${IMAGES_URL}${image}`
  return (
    <Link
      to={`/products/${slug}`}
      className={`
        rounded-xl transition-transform hover:scale-105 hover:shadow-md
        [&:nth-child(4n+1)]:bg-gradient-orange
        [&:nth-child(4n+2)]:bg-gradient-pink
        [&:nth-child(4n+3)]:bg-gradient-primary 
        [&:nth-child(4n+4)]:bg-gradient-violet 
        [&:nth-child(4n+5)]:bg-gradient-primary
        [&:nth-child(4n+6)]:bg-gradient-pink 
        `}
    >
      <Card className="relative border-none text-white">
        <CardHeader>
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription className="text-lg">
            {formatPrice(price)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <img
            className="absolute right-5 top-1/2 h-32 w-32 -translate-y-1/2 transition-[right]"
            alt={image}
            src={imageUrl}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-start gap-x-2">
          <span className="text-sm font-light">View product</span>
          <ArrowRightLong className="h-4 w-4" />
        </CardFooter>
      </Card>
    </Link>
  )
}
