import { Alg, Crv, Jwk, Kty } from '@/rafiki/backend/generated/graphql'
import { KeyObject, createPublicKey } from 'crypto'

export const generateJwk = (privateKey: KeyObject, keyId: string) => {
  if (!keyId.trim()) {
    throw new Error('KeyId cannot be empty')
  }

  if (!privateKey) {
    throw new Error('private key cannot be empty')
  }

  const jwk = createPublicKey(privateKey).export({
    format: 'jwk'
  })
  if (jwk.x === undefined) {
    throw new Error('Failed to derive public key')
  }

  if (jwk.crv !== 'Ed25519' || jwk.kty !== 'OKP' || !jwk.x) {
    throw new Error('Key is not EdDSA-Ed25519')
  }

  return {
    alg: Alg.EdDsa,
    kid: keyId,
    kty: Kty.Okp,
    crv: Crv.Ed25519,
    x: jwk.x
  }
}

export const validateJwk = (jwk: Jwk) => {
  if (jwk.crv !== 'Ed25519' || jwk.kty !== 'OKP' || !jwk.x) {
    throw new Error('Key is not EdDSA-Ed25519')
  }

  return {
    alg: Alg.EdDsa,
    kid: jwk.kid,
    kty: Kty.Okp,
    crv: Crv.Ed25519,
    x: jwk.x
  }
}
