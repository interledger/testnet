import { RouteObject } from 'react-router-dom'

export const ordersRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: () => import('./index.tsx')
      },
      {
        path: ':id',
        lazy: () => import('./$id.tsx')
      }
    ]
  }
]
