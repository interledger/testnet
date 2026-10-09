// Must stay the first import. See telemetry.ts.
import { telemetry } from './telemetry'
import { App } from './app'
import { env } from './config/env'
import { createContainer } from '@/createContainer'
import console from 'console'
import process from 'process'

// Kubernetes sends SIGKILL 30 seconds after SIGTERM by default.
const SHUTDOWN_TIMEOUT_MS = 10_000

BigInt.prototype.toJSON = function (this: bigint) {
  return this.toString()
}
export const start = async (app: App): Promise<void> => {
  await app.startServer()
}

// Stops the app, then flushes the telemetry that is still buffered.
const handleShutdown = (app: App) => async (signal: NodeJS.Signals) => {
  console.log(`Received ${signal}, shutting down`)
  setTimeout(() => {
    console.log('Shutdown timed out')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT_MS).unref()

  let exitCode = 0
  try {
    await app.stop()
  } catch (e) {
    console.log('Error on stopping the app')
    console.log(e)
    exitCode = 1
  }
  try {
    await telemetry.shutdown()
  } catch (e) {
    console.log('Error on flushing telemetry')
    console.log(e)
  }
  process.exit(exitCode)
}

async function bootstrap() {
  const container = await createContainer(env)
  const app = new App(container)

  try {
    await start(app)

    await app.processResources()
  } catch (e) {
    console.log('Error on starting the app')
    console.log(e)
    await telemetry.shutdown().catch(() => {})
    process.exit(1)
  }

  const shutdown = handleShutdown(app)
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}

if (!module.parent) {
  bootstrap()
}
