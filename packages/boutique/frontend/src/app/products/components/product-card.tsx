import { queryClient } from '@/app/query-client'
import { ArrowRightLong } from '@/components/icons.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card.tsx'
import type { Product } from '@/hooks/use-products-query'
import { IMAGES_URL } from '@/lib/constants.ts'
import { fetcher } from '@/lib/fetcher.ts'
import { useThemeContext } from '@/lib/theme'
import { formatPrice } from '@/lib/utils.ts'
import { Link } from 'react-router-dom'

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { name, price, image, imageDark, slug } = product
  const { theme } = useThemeContext()
  const imageUrl = `${IMAGES_URL}${theme === 'light' ? image : imageDark}`
  return (
    <Link
      onMouseEnter={async () => {
        await queryClient.prefetchQuery({
          queryKey: ['products', slug],
          queryFn: async function () {
            return await fetcher(`/products/${slug}`, {
              method: 'GET'
            })
          }
        })
      }}
      to={`/products/${slug}`}
      className={`rounded-xl border-2 transition-transform hover:scale-105 focus:scale-105 focus:outline-none 
        hover:dark:shadow-glow-link focus:dark:shadow-glow-link
        [&:nth-child(4n+1)]:border-green [&:nth-child(4n+2)]:border-black [&:nth-child(4n+3)]:border-green [&:nth-child(4n+4)]:border-black [&:nth-child(4n+5)]:border-green [&:nth-child(4n+6)]:border-black
        dark:[&:nth-child(4n+1)]:border-yellow-neon dark:[&:nth-child(4n+2)]:border-pink-neon dark:[&:nth-child(4n+3)]:border-green-neon dark:[&:nth-child(4n+4)]:border-teal-neon dark:[&:nth-child(4n+5)]:border-yellow-neon dark:[&:nth-child(4n+6)]:border-pink-neon
        dark:[&:nth-child(4n+1)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--yellow-neon)),_0_0_.4rem_rgb(var(--yellow-neon)),_inset_0_0_.6rem_rgb(var(--yellow-neon))]
        dark:[&:nth-child(4n+2)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--pink-neon)),_0_0_.4rem_rgb(var(--pink-neon)),_inset_0_0_.6rem_rgb(var(--pink-neon))]
        dark:[&:nth-child(4n+3)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--green-neon)),_0_0_.4rem_rgb(var(--green-neon)),_inset_0_0_.6rem_rgb(var(--green-neon))]
        dark:[&:nth-child(4n+4)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--teal-neon)),_0_0_.4rem_rgb(var(--teal-neon)),_inset_0_0_.6rem_rgb(var(--teal-neon))]
        dark:[&:nth-child(4n+5)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--yellow-neon)),_0_0_.4rem_rgb(var(--yellow-neon)),_inset_0_0_.6rem_rgb(var(--yellow-neon))]
        dark:[&:nth-child(4n+6)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--pink-neon)),_0_0_.4rem_rgb(var(--pink-neon)),_inset_0_0_.6rem_rgb(var(--pink-neon))]
      hover:dark:[&:nth-child(4n+1)]:border-white hover:dark:[&:nth-child(4n+2)]:border-white hover:dark:[&:nth-child(4n+3)]:border-white hover:dark:[&:nth-child(4n+4)]:border-white hover:dark:[&:nth-child(4n+5)]:border-white hover:dark:[&:nth-child(4n+6)]:border-white
      focus:dark:[&:nth-child(4n+1)]:border-white focus:dark:[&:nth-child(4n+2)]:border-white focus:dark:[&:nth-child(4n+3)]:border-white focus:dark:[&:nth-child(4n+4)]:border-white focus:dark:[&:nth-child(4n+5)]:border-white focus:dark:[&:nth-child(4n+6)]:border-white
        [&:nth-child(4n+1)]:[--accent:rgb(var(--green))] [&:nth-child(4n+2)]:[--accent:rgb(var(--black))] [&:nth-child(4n+3)]:[--accent:rgb(var(--green))] [&:nth-child(4n+4)]:[--accent:rgb(var(--black))] [&:nth-child(4n+5)]:[--accent:rgb(var(--green))] [&:nth-child(4n+6)]:[--accent:rgb(var(--black))]
        dark:[&:nth-child(4n+1)]:[--accent:rgb(var(--yellow-neon))] dark:[&:nth-child(4n+2)]:[--accent:rgb(var(--pink-neon))] dark:[&:nth-child(4n+3)]:[--accent:rgb(var(--green-neon))] dark:[&:nth-child(4n+4)]:[--accent:rgb(var(--teal-neon))] dark:[&:nth-child(4n+5)]:[--accent:rgb(var(--yellow-neon))] dark:[&:nth-child(4n+6)]:[--accent:rgb(var(--pink-neon))]
        `}
    >
      <Card className="relative border-none text-[--accent]">
        <CardHeader>
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription className="text-lg">
            {formatPrice(price)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <img
            className="absolute right-5 top-1/2 h-42 w-32 -translate-y-1/2 transition-[right]"
            alt={theme === 'light' ? image : imageDark}
            src={imageUrl}
          />
        </CardContent>
        <CardFooter className="flex items-center justify-start gap-x-2">
          <span className="text-sm font-light">View product</span>
          <ArrowRightLong className="h-4 w-4" aria-label="right arrow" />
        </CardFooter>
      </Card>
    </Link>
  )
}
