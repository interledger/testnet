import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head />
      <body className="h-screen bg-white text-black dark:bg-purple dark:text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
