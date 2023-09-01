import { Shimmer } from '@/components/ui/shimmer.tsx'

export const ProductShimmer = () => {
  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-x-12">
      <div className="aspect-h-1 aspect-w-1 mx-auto h-80 w-80 overflow-hidden rounded-md bg-gray-50  lg:w-full">
        <Shimmer className="h-full w-full" />
      </div>
      <div className="col-span-2 mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
        <Shimmer className="h-10 w-24" />
        <Shimmer className="mt-3 h-10 w-60" />
        <Shimmer className="mt-6 h-20 w-full" />
      </div>
    </div>
  )
}
