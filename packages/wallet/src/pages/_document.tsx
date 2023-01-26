import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="h-full">
      <Head />
      <body className="h-full bg-gray-100 text-lg">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
