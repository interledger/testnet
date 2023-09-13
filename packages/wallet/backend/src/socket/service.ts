import { env, type Env } from '@/config/env'
import { Logger } from 'winston'
import socketIo from 'socket.io'
import http from 'http'
import { unsealData } from 'iron-session'
import { AccountService } from '@/account/service'

interface ISocketService {
  init(args: http.Server): void
  emitAccountsUpdateById(id: string): void
}

interface SocketServiceDependencies {
  logger: Logger
  env: Env
  accountService: AccountService
}

export class SocketService implements ISocketService {
  private io: socketIo.Server | null = null

  constructor(private deps: SocketServiceDependencies) {}

  init(server: http.Server) {
    this.io = new socketIo.Server(server, {
      cors: {
        origin: [
          'http://localhost:4003',
          `https://${this.deps.env.RAFIKI_MONEY_FRONTEND_HOST}`
        ],
        credentials: true
      }
    })
    this.deps.logger.info(`Socket Server is started...`)

    this.io.on('connection', async (socket) => {
      const cookie = socket.request.headers['cookie']
      const token = cookie?.toString().split('=')[1]

      const { user } = await unsealData(token as string, {
        password: env.COOKIE_PASSWORD
      })

      const userId = (user as UserSessionData).id
      this.deps.logger.info(`A socket client ${userId} is connected...`)
      socket.join(userId)

      // Handle events
      socket.on('disconnect', () => {
        socket.leave(userId)
        this.deps.logger.info(`A socket client ${userId} disconnected...`)
      })
    })
  }

  async emitAccountsUpdateById(userId?: string) {
    if (!userId) return

    const accounts = await this.deps.accountService.getAccounts(userId, false)
    this.io?.to(userId).emit('ACCOUNTS_UPDATE', accounts)
  }
}
