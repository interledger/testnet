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
import { formatAmount } from '@/utils/helpers'

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
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    // Event listeners
    socket?.on('MONEY_RECEIVED', (account, amount) => {
      toast({
        description: (
          <p>
            <MoneyBird className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
            You received{' '}
            {
              formatAmount({
                value: amount.value,
                assetCode: amount.assetCode,
                assetScale: amount.assetScale
              }).amount
            }{' '}
            into account {account.name}.
          </p>
        ),
        variant: 'success'
      })
      updateBalance(
        {
          balance: account.balance,
          assetCode: account.assetCode,
          assetScale: account.assetScale
        },
        account.balance
      )
    })

    socket?.on('MONEY_SENT_SHOP', (account, amount) => {
      toast({
        description: (
          <p>
            <MoneyBird className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
            Rafiki Boutique one click buy withdrew{' '}
            {
              formatAmount({
                value: amount.value,
                assetCode: amount.assetCode,
                assetScale: amount.assetScale
              }).amount
            }{' '}
            from your account {account.name}.
          </p>
        ),
        variant: 'success'
      })
      updateBalance(
        {
          balance: account.balance,
          assetCode: account.assetCode,
          assetScale: account.assetScale
        },
        account.balance
      )
    })

    socket?.on('MONEY_SENT', (account) => {
      updateBalance(
        {
          balance: account.balance,
          assetCode: account.assetCode,
          assetScale: account.assetScale
        },
        account.balance
      )
    })

    // log out the user when connection error occurs
    socket.on('connect_error', async (error) => {
      console.error('Trying to connect again. Connection error:', error)
      setTimeout(() => {
        socket?.connect()
      }, 1000)
    })

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
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
