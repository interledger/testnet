import { accessSync, constants, readFileSync, statSync } from 'fs'
import { resolve } from 'path'

const PEM_MARKER = '-----BEGIN '

/**
 * Checks one file for use as TLS material.
 * Returns null if the file is usable. Returns the reason if it is not.
 *
 * Each reason names the absolute path. Node resolves a relative path against
 * the working directory. In a container that directory is not always obvious.
 */
function inspect(resolved: string): string | null {
  let isFile: boolean
  try {
    isFile = statSync(resolved).isFile()
  } catch {
    return `file does not exist (${resolved})`
  }

  if (!isFile) return `path is not a regular file (${resolved})`

  try {
    accessSync(resolved, constants.R_OK)
  } catch {
    return `file is not readable (${resolved})`
  }

  const contents = readFileSync(resolved)
  if (contents.byteLength === 0) return `file is empty (${resolved})`
  if (!contents.includes(PEM_MARKER)) {
    return `file is not PEM: no "${PEM_MARKER.trim()}" line found (${resolved})`
  }

  return null
}

/**
 * Checks the file at `filePath`.
 * Returns null if the file is usable. Returns the reason if it is not.
 *
 * Environment validation calls this for each path. It collects every reason,
 * so one start-up reports all the bad paths.
 */
export function validateTlsFile(filePath: string): string | null {
  return inspect(resolve(filePath))
}

/**
 * Reads one PEM file and returns the bytes.
 * Throws an error if the file is not usable. The message names `variable`,
 * so the operator knows which environment variable to correct.
 *
 * The Atalla transport accepts a Buffer. This function does not decode or
 * change the bytes.
 */
export function readTlsFile(variable: string, filePath: string): Buffer {
  const resolved = resolve(filePath)
  const problem = inspect(resolved)

  if (problem) throw new Error(`${variable}: ${problem}`)

  return readFileSync(resolved)
}
