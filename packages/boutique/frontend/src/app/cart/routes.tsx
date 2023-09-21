import { RouteObject } from 'react-router-dom'

export const cartRoutes: RouteObject[] = [
  {
    children: [
      {
        index: true,
        lazy: () => import('./index.tsx')
      }
    ]
  }
]
