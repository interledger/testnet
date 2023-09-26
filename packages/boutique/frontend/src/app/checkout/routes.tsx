import { Navigate, RouteObject } from 'react-router-dom'

export const checkoutRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: () => import('./index.tsx')
      },
      {
        path: 'confirmation',
        errorElement: <Navigate to="/cart" />,
        lazy: () => import('./confirmation.tsx')
      }
    ]
  }
]
