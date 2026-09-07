import type { Env } from '@/config/env'
import type { IssuerServerConfig } from '@interledger/hsm-atalla-issuer'
import type { MerchantServerConfig } from '@interledger/hsm-atalla-merchant'
import type { AtallaTransportConfig } from '@interledger/hsm-atalla-transport'

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
    tls: env.ATALLA_TLS_ENABLED
      ? {
          ca: env.ATALLA_CA_CERT as string,
          cert: env.ATALLA_CLIENT_CERT as string,
          key: env.ATALLA_CLIENT_KEY as string,
          skipServerIdentityCheck: env.ATALLA_SKIP_SERVER_IDENTITY_CHECK
        }
      : false
  }
}
