import type { NextPage } from 'next/types'
import type { AppProps } from 'next/app'
import type { ReactElement, ReactNode } from 'react'

export type NextPageWithLayout<Props = {}, InitialProps = Props> = NextPage<
  Props,
  InitialProps
> & {
  getLayout?: (page: ReactElement) => ReactNode
}

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}
