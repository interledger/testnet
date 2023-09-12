import { RouteObject } from 'react-router-dom'

export const checkoutRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: () => import('./index.tsx')
      },
      {
        path: 'confirmation',
        lazy: () => import('./confirmation.tsx')
      }
    ]
  }
]
