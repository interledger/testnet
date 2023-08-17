import { RouteObject } from 'react-router-dom'

export const productsRoutes: RouteObject[] = [
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
