import { type Env } from '@/config/env'
import { Logger } from 'winston'
import socketIo from 'socket.io'
import http from 'http'
import { AccountService } from '@/account/service'
import MessageType from './messageType'
import { withSession } from '@/middleware/withSession'

interface ISocketService {
  init(args: http.Server): void
  emitMoneyReceivedByUserId(id: string, assetCode: string): void
  emitMoneySentByUserId(id: string, assetCode: string): void
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

    this.io.engine.use(withSession)
    this.io.on('connection', async (socket) => {
      const user = socket.request.session.user
      if (!user) {
        this.deps.logger.info(`The socket user is not still logged in...`)
        return
      }

      const userId = user.id
      this.deps.logger.info(`A socket client ${userId} is connected...`)
      socket.join(userId)

      // Handle events
      socket.on('disconnect', () => {
        socket.leave(userId)
        this.deps.logger.info(`A socket client ${userId} disconnected...`)
      })

      socket.on('error', (e) => {
        this.deps.logger.error('Error in socket communication', e)
      })
    })
  }

  async emitMoneyReceivedByUserId(userId: string, assetCode: string) {
    const account = await this.deps.accountService.getAccountByAssetCode(
      userId,
      assetCode
    )
    this.io?.to(userId).emit(MessageType.MONEY_RECEIVED, account)
  }

  async emitMoneySentByUserId(userId: string, assetCode: string) {
    const account = await this.deps.accountService.getAccountByAssetCode(
      userId,
      assetCode
    )
    this.io?.to(userId).emit(MessageType.MONEY_SENT, account)
  }
}
