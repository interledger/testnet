import { Env } from '@/config/env'
import { Logger } from 'winston'
import { HttpClient } from '@/rhyza/http-client'
import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { RhyzaIdpClient } from '@/rhyza/idp-client'

export function createRhyzaAdminClient(env: Env, logger: Logger) {
  return new RhyzaAdminClient(
    new HttpClient(
      { baseUrl: env.RHYZA_ADMIN_API_URL },
      logger.child({ service: RhyzaAdminClient.name })
    )
  )
}

export function createRhyzaIdpClient(env: Env, logger: Logger) {
  return new RhyzaIdpClient(
    new HttpClient(
      {
        baseUrl: env.RHYZA_IDP_API_URL,
        headers: { 'x-idp-secret': env.AUTH_IDENTITY_SERVER_SECRET }
      },
      logger.child({ service: RhyzaIdpClient.name })
    )
  )
}
