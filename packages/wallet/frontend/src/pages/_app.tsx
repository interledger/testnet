import '@/styles/main.css'
import Head from 'next/head'
import { Titillium_Web } from 'next/font/google'
import { AppProvider } from '@/components/providers'
import { Progress } from '@/ui/Progress'
import type { AppPropsWithLayout } from '@/lib/types/app'
import { Toaster } from '@/components/toast/Toaster'
import { MoneyBird } from '@/components/icons/MoneyBird'
import { useToast } from '@/lib/hooks/useToast'
import { io, Socket } from 'socket.io-client'
import { useEffect } from 'react'

const titilium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  preload: true
})

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)
  const { toast } = useToast()

  useEffect(() => {
    let socket: Socket | null = null
    // Connect to the Socket.IO server
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL ?? '', {
      withCredentials: true
    })

    // Event listeners
    socket?.on('connect', () => {
      console.log('Connected to server')
    })

    socket?.on('MONEY_RECEIVED', (data) => {
      console.log(`Account ${data.name} updated`)
      toast({
        description: (
          <p>
            <MoneyBird className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
            You received some {data.assetCode} into account {data.name}.
          </p>
        ),
        variant: 'success'
      })
    })

    socket?.on('MONEY_SENT', (data) => {
      console.log(`Account ${data.name} updated`)
      toast({
        description: (
          <p>
            <MoneyBird className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
            You sent some {data.assetCode} into account {data.name}.
          </p>
        ),
        variant: 'success'
      })
    })

    socket?.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    // Clean up when the component unmounts
    return () => {
      socket?.disconnect()
    }
  }, [toast])
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
