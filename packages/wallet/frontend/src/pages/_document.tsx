import {
  RUNTIME_CONFIG_WINDOW_KEY,
  readRuntimeConfigFromEnv
} from '@/lib/runtimeConfig'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  // Runs on the server per request, so it reads the pod environment.
  const runtimeConfig = readRuntimeConfigFromEnv()

  // `</script>` inside a string would close the tag early.
  const serialisedConfig = JSON.stringify(runtimeConfig).replace(
    /</g,
    '\\u003c'
  )

  return (
    <Html
      lang="en"
      className={`h-full ${runtimeConfig.theme}`}
      style={{ colorScheme: runtimeConfig.theme }}
    >
      <Head />
      <body className="h-screen bg-white text-black dark:bg-purple dark:text-white">
        {/* Ahead of <Main /> and <NextScript />, so it runs first. */}
        <script
          id="wallet-runtime-config"
          dangerouslySetInnerHTML={{
            __html: `window.${RUNTIME_CONFIG_WINDOW_KEY}=${serialisedConfig}`
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
