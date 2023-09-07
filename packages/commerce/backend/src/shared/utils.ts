import { createPrivateKey } from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null
}

export function deleteProperty<T, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [key]: _, ...newObj } = obj
  return newObj
}

interface SuccessResponse extends Omit<TypedResponseBody, 'errors'> {}
interface ErrorResponse extends Omit<TypedResponseBody, 'data'> {}

export function toSuccessReponse<T>(
  data: T,
  message: string = 'SUCCESS'
): SuccessResponse {
  return {
    success: true,
    message: message,
    data
  }
}

export function toErrorResponse(
  errors: Record<string, string>,
  message: string = 'Error'
): ErrorResponse {
  return {
    success: false,
    message,
    errors
  }
}

export function parseKey(keyFile: string) {
  try {
    const key = createPrivateKey(
      readFileSync(path.join(process.cwd(), keyFile))
    )
    const jwk = key.export({ format: 'jwk' })

    if (jwk.crv !== 'Ed25519') {
      throw new Error('Private key is not EdDSA-Ed25519 key.')
    }

    if (jwk.crv === 'Ed25519') {
      return key
    }
  } catch (err) {
    console.log(isObject(err) ? err.message : err)
    throw err
  }
}
