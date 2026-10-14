/**
 * Next.js calls `register()` once when the server starts. Telemetry covers the
 * Node.js server only: the edge middleware and the browser send nothing.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
}
