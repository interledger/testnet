import { NotFound } from '@shared/backend'
import { HttpClient, RhyzaServerError } from '@/rhyza/http-client'
import { Grant, GrantAccess, GrantState, GrantSubjectId } from '@/rhyza/types'

interface GrantResponse {
  id: string
  access: GrantAccess[]
  subject?: { sub_ids: GrantSubjectId[] }
  state: GrantState
}

const GRPC_NOT_FOUND = '5'

export class RhyzaIdpClient {
  constructor(private http: HttpClient) {}

  async getGrant(id: string): Promise<Grant> {
    try {
      const response = await this.http.get<GrantResponse>(
        `/grant/${encodeURIComponent(id)}`
      )
      return {
        id: response.id,
        state: response.state,
        access: response.access,
        subjectIds: response.subject?.sub_ids ?? []
      }
    } catch (e) {
      // The IdP has no error handler, so a missing grant comes back as a 500 carrying the gRPC code.
      if (isGrpcNotFound(e)) throw new NotFound(`Grant ${id} not found`)
      throw e
    }
  }
}

function isGrpcNotFound(e: unknown): boolean {
  if (!(e instanceof RhyzaServerError)) return false
  const body = e.body as { code?: unknown } | undefined
  return body?.code === GRPC_NOT_FOUND
}
