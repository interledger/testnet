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
import { queryClient } from './query-client.ts'
import { Toaster } from '@/components/ui/toaster.tsx'
import { cartRoutes } from './cart/routes.tsx'
import { ThemeProvider } from '@/components/theme-provider.tsx'
import { checkoutRoutes } from './checkout/routes.tsx'

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
      },
      {
        path: '/cart',
        children: cartRoutes
      },
      {
        path: '/checkout',
        children: checkoutRoutes
      }
    ]
  }
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
