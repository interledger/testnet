import { Env } from '@/config/env'
import {
  GraphQLClient,
  type RequestMiddleware,
  type Variables
} from 'graphql-request'
import { canonicalize } from 'json-canonicalize'
import { createHmac } from 'crypto'

// Type for the request body in GraphQL requests
interface GraphQLRequestBody {
  query: string
  variables?: Variables
  operationName?: string
}

function createSignedClient(endpoint: string, env: Env) {
  const middleware: RequestMiddleware = async (request) => {
    try {
      const timestamp = Date.now()
      const version = env.ADMIN_SIGNATURE_VERSION

      // Extract query from the request body
      let query = ''
      if (request.body && typeof request.body === 'string') {
        try {
          const body: GraphQLRequestBody = JSON.parse(request.body)
          query = body.query || ''
        } catch (e) {
          // Body is not valid JSON - this shouldn't happen with GraphQL requests
          // but we'll handle it gracefully
          query = ''
        }
      }

      const formattedRequest = {
        variables: request.variables ?? {},
        operationName: request.operationName,
        query
      }

      const payload = `${timestamp}.${canonicalize(formattedRequest)}`

      const hmac = createHmac('sha256', env.ADMIN_API_SECRET)
      hmac.update(payload)
      const digest = hmac.digest('hex')

      const signature = `t=${timestamp}, v${version}=${digest}`

      return {
        ...request,
        headers: {
          ...(request.headers as Record<string, string>),
          signature,
          'tenant-id': env.OPERATOR_TENANT_ID
        }
      }
    } catch (e) {
      return request
    }
  }

  return new GraphQLClient(endpoint, {
    requestMiddleware: middleware
  })
}

export function createBackendGraphQLClient(env: Env) {
  return createSignedClient(env.GRAPHQL_ENDPOINT, env)
}

export function createAuthGraphQLClient(env: Env) {
  return createSignedClient(env.AUTH_GRAPHQL_ENDPOINT, env)
}
