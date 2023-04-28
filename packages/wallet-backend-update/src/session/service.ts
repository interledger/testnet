import { Session } from './model'

interface ISessionService {
  getById(id: string): Promise<Session | undefined>
}

export class SessionService implements ISessionService {
  public async getById(id: string): Promise<Session | undefined> {
    return Session.query().findById(id)
  }
}
