import { createPublicKey, generateKeyPairSync } from 'crypto'

export const generateJWK = () => {
  const { privateKey } = generateKeyPairSync('ed25519')
  const publicKey = createPublicKey(privateKey)
  const jwk = publicKey.export({
    format: 'jwk'
  })
  const publicKeyPEM = publicKey
    .export({ type: 'spki', format: 'pem' })
    .toString()
  const privateKeyPEM = privateKey
    .export({ type: 'pkcs8', format: 'pem' })
    .toString()

  return {
    privateKey: privateKeyPEM,
    publicKey: publicKeyPEM,
    jwk
  }
}
