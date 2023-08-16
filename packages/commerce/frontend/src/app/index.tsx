import { BaseLayout } from '@/components/layouts/base.tsx'
import {
  RouterProvider,
  createBrowserRouter,
  type RouteObject
} from 'react-router-dom'
import { ordersRoutes } from './orders/index.tsx'

export const routes = [
  {
    element: <BaseLayout />,
    children: [
      {
        index: true,
        lazy: () => import('./products.tsx')
      },
      {
        path: '/orders',
        children: [ordersRoutes]
      }
    ]
  }
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export function App() {
  return <RouterProvider router={router} />
}
