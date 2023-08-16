import { RouteObject } from 'react-router-dom'

export const ordersRoutes: RouteObject = {
  children: [
    {
      index: true,
      lazy: () => import('./overview.tsx')
    },
    {
      path: ':id',
      lazy: () => import('./$id/index.tsx')
    }
  ]
}
