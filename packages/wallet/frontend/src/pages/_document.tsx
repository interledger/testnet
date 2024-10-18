import { THEME } from '@/utils/constants'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html
      lang="en"
      className={`h-full ${THEME}`}
      style={{ colorScheme: THEME }}
    >
      <Head />
      <body className="h-screen bg-white text-black dark:bg-purple dark:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
