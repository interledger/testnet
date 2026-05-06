import { Navigate, RouteObject } from 'react-router-dom'

export const subscriptionsRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: () => import('./index.tsx')
      },
      {
        path: 'confirmation',
        errorElement: <Navigate to="/products" />,
        lazy: () => import('./confirmation.tsx')
      }
    ]
  }
]
