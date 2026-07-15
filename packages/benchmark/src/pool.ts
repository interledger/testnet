/**
 * Run `workerCount` copies of `task` concurrently and resolve once all have
 * finished. Each invocation receives its zero-based worker id. If any worker
 * rejects, the returned promise rejects with the first error (the others are
 * still awaited to avoid dangling work).
 */
export async function runPool(
  workerCount: number,
  task: (workerId: number) => Promise<void>
): Promise<void> {
  if (!Number.isInteger(workerCount) || workerCount < 1) {
    throw new Error(
      `workerCount must be a positive integer, got ${workerCount}`
    )
  }

  const results = await Promise.allSettled(
    Array.from({ length: workerCount }, (_unused, id) => task(id))
  )

  const firstRejection = results.find(
    (r): r is PromiseRejectedResult => r.status === 'rejected'
  )
  if (firstRejection) {
    throw firstRejection.reason
  }
}
