import type { Env } from '@/config/env'
import type { IssuerServerConfig } from '@interledger/hsm-atalla-issuer'
import type { MerchantServerConfig } from '@interledger/hsm-atalla-merchant'
import type { AtallaTransportConfig } from '@interledger/hsm-atalla-transport'
import { readTlsFile } from '@/hsm/atalla/tls-files'

export interface AtallaServerConfig {
  role: 'both' | 'issuer' | 'merchant'
  issuer: IssuerServerConfig
  merchant: MerchantServerConfig
}

export function createAtallaServerConfig(env: Env): AtallaServerConfig {
  const hsm = createAtallaTransportConfig(env)

  return {
    role: env.HSM_SERVER_ROLE,
    issuer: {
      grpc: {
        host: env.ISSUER_GRPC_HOST ?? env.HSM_GRPC_HOST,
        port: env.ISSUER_GRPC_PORT
      },
      hsm
    },
    merchant: {
      grpc: {
        host: env.MERCHANT_GRPC_HOST ?? env.HSM_GRPC_HOST,
        port: env.MERCHANT_GRPC_PORT
      },
      hsm
    }
  }
}

function createAtallaTransportConfig(env: Env): AtallaTransportConfig {
  return {
    host: env.ATALLA_HOST as string,
    port: env.ATALLA_PORT as number,
    timeoutMs: env.ATALLA_TIMEOUT_MS,
    poolSize: env.ATALLA_POOL_SIZE,
    // The HSM service calls this function when it starts. Environment
    // validation has already checked these paths. A restart reads the files
    // again, so a new certificate needs no new deployment.
    tls: env.ATALLA_TLS_ENABLED
      ? {
          ca: readTlsFile('ATALLA_CA_CERT_PATH', env.ATALLA_CA_CERT_PATH!),
          cert: readTlsFile(
            'ATALLA_CLIENT_CERT_PATH',
            env.ATALLA_CLIENT_CERT_PATH!
          ),
          key: readTlsFile(
            'ATALLA_CLIENT_KEY_PATH',
            env.ATALLA_CLIENT_KEY_PATH!
          ),
          skipServerIdentityCheck: env.ATALLA_SKIP_SERVER_IDENTITY_CHECK
        }
      : false
  }
}
