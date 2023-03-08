import '@/styles/main.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Titillium_Web } from 'next/font/google'
import { AppProvider } from '@/components/providers'

const titilium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900']
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Interledger Wallet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{`
        html {
          font-family: ${titilium.style.fontFamily};
        }
      `}</style>
      <AppProvider>
        <Component {...pageProps} />
      </AppProvider>
    </>
  )
}
