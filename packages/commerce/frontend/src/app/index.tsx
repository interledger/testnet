import { BaseLayout } from '@/components/layouts/base.tsx'
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  type RouteObject
} from 'react-router-dom'
import { ordersRoutes } from './orders/routes.tsx'
import { productsRoutes } from './products/routes.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { QueryClient } from '@tanstack/react-query'

const Index = () => {
  return <Navigate to={`/products`} replace />
}

export const routes = [
  {
    element: <BaseLayout />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: '/products',
        children: productsRoutes
      },
      {
        path: '/orders',
        children: ordersRoutes
      }
    ]
  }
] satisfies RouteObject[]

const router = createBrowserRouter(routes)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: Infinity
    }
  }
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
