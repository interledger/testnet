import * as crypto from 'crypto'
import * as fs from 'fs'

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
    console.log(keyFile)
    const key = crypto.createPrivateKey(fs.readFileSync(keyFile))

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

export function parseOrProvisionKey(
  keyFile: string | undefined
): crypto.KeyObject {
  const TMP_DIR = './tmp'
  if (keyFile) {
    try {
      const key = crypto.createPrivateKey(fs.readFileSync(keyFile))
      const jwk = key.export({ format: 'jwk' })
      if (jwk.crv === 'Ed25519') {
        console.log(`Key ${keyFile} loaded.`)
        return key
      } else {
        console.log('Private key is not EdDSA-Ed25519 key. Generating new key.')
      }
    } catch (err) {
      console.log('Private key could not be loaded.')
      throw err
    }
  }
  const keypair = crypto.generateKeyPairSync('ed25519')
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR)
  }
  fs.writeFileSync(
    `${TMP_DIR}/private-key-${new Date().getTime()}.pem`,
    keypair.privateKey.export({ format: 'pem', type: 'pkcs8' })
  )
  return keypair.privateKey
}

export function extractUuidFromUrl(url: string): string | null {
  const regex =
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const match = url.match(regex)
  return match ? match[0] : null
}
