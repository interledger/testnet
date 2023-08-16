import { BaseLayout } from '@/components/layouts/base.tsx'
import {
  RouterProvider,
  createBrowserRouter,
  type RouteObject
} from 'react-router-dom'

export const routes = [
  {
    element: <BaseLayout />,
    children: [
      {
        path: '/',
        lazy: () => import('./products.tsx')
      }
    ]
  }
] satisfies RouteObject[]

const router = createBrowserRouter(routes)

export function App() {
  return <RouterProvider router={router} />
}
