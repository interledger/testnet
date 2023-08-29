import { Shimmer } from '@/components/ui/shimmer.tsx'

export const ProductShimmer = () => {
  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-x-12">
      <div className="aspect-h-1 aspect-w-1 mx-auto h-80 w-80 overflow-hidden rounded-md bg-gray-50  lg:w-full">
        <Shimmer className="h-full w-full" />
      </div>
      <div className="col-span-2 mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
        <h1 className="text-3xl font-bold tracking-tight">
          <Shimmer className="h-10 w-24" />
        </h1>
        <div className="mt-3">
          <p className="text-3xl tracking-tight">
            <Shimmer className="h-10 w-60" />
          </p>
        </div>
        <div className="prose mt-6 max-w-full">
          <Shimmer className="h-20 w-full" />
        </div>
      </div>
    </div>
  )
}
