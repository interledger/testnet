import { Card, CardContent } from '@/components/ui/card.tsx'
import { Skeleton } from '@/components/ui/shimmer'

export const ProductCardShimmer = () => {
  return (
    <Card className="overflow-hidden border-none">
      <CardContent className="p-0">
        <Skeleton className="h-36" />
      </CardContent>
    </Card>
  )
}
