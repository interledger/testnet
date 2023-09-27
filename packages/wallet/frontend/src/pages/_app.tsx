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
import { updateBalance } from '@/lib/balance'
import { userService } from '@/lib/api/user'
import { useRouter } from 'next/router'

const titilium = Titillium_Web({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600', '700', '900'],
  preload: true
})

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    let socket: Socket | null = null
    // Connect to the Socket.IO server
    socket = io(process.env.NEXT_PUBLIC_BACKEND_URL ?? '', {
      withCredentials: true
    })

    // Event listeners
    socket?.on('MONEY_RECEIVED', (data) => {
      toast({
        description: (
          <p>
            <MoneyBird className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
            You received some {data.assetCode} into account {data.name}.
          </p>
        ),
        variant: 'success'
      })
      updateBalance(
        {
          balance: data.balance,
          assetCode: data.assetCode,
          assetScale: data.assetScale
        },
        data.balance
      )
    })

    socket?.on('MONEY_SENT', (data) => {
      updateBalance(
        {
          balance: data.balance,
          assetCode: data.assetCode,
          assetScale: data.assetScale
        },
        data.balance
      )
    })

    // log out the user when connection error occurs
    socket.on('connect_error', async () => {
      setTimeout(() => {
        socket?.connect()
      }, 1000)
    })

    // Clean up when the component unmounts
    return () => {
      socket?.disconnect()
    }
  }, [router, toast])

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
