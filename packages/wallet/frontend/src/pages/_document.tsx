import {
  RUNTIME_CONFIG_WINDOW_KEY,
  readRuntimeConfigFromEnv
} from '@/lib/runtimeConfig'
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  // This runs on the server for every request, so it reads the environment the
  // pod runs with. `_app.tsx` keeps it that way by turning off Automatic
  // Static Optimization.
  const runtimeConfig = readRuntimeConfigFromEnv()

  // `</script>` inside a string would close this tag early. Escaping `<` is
  // the standard defence, and it keeps the JSON valid.
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
        {/*
          Written ahead of <Main /> and <NextScript /> so the value is present
          before any application module reads it.
        */}
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
