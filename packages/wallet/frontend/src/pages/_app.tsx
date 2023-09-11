import '@/styles/main.css'
import Head from 'next/head'
import { Titillium_Web } from 'next/font/google'
import { AppProvider } from '@/components/providers'
import { Progress } from '@/ui/Progress'
import type { AppPropsWithLayout } from '@/lib/types/app'
import { Toaster } from '@/components/toast/Toaster'
import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
// import { useToast } from '@/lib/hooks/useToast'
// import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

const titilium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  preload: true
})

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)
  // const { toast } = useToast()
  
  useEffect(() => {
    // let socket: Socket | null = null
    // // Connect to the Socket.IO server
    // socket = io(process.env.NEXT_PUBLIC_BACKEND_URL ?? '', {
    //   auth: {
    //   }
    // })

    // // Event listeners
    // socket?.on('connect', () => {
    //   console.log('Connected to server')
    // })

    // socket?.on('ACCOUNTS_UPDATE', (data) => {
    //   console.log(`Account ${data[0].name} updated`)
    //   toast({
    //     title: 'You received some money.',
    //     description: (
    //       <p>
    //         You received some {data[0].assetCode} into account {data[0].name}.
    //       </p>
    //     ),
    //     variant: 'success'
    //   })
    // })

    // socket?.on('disconnect', () => {
    //   console.log('Disconnected from server')
    // })

    // // Clean up when the component unmounts
    // return () => {
    //   socket?.disconnect()
    // }
  }, [])
  
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
        <Progress />
        <Toaster />
        {getLayout(<Component {...pageProps} />)}
      </AppProvider>
    </>
  )
}