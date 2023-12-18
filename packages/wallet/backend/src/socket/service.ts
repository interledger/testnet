import { type Env } from '@/config/env'
import { Logger } from 'winston'
import socketIo from 'socket.io'
import http from 'http'
import { AccountService } from '@/account/service'
import MessageType from './messageType'
import { withSession } from '@/middleware/withSession'
import { Amount } from '@/rafiki/backend/generated/graphql'

interface ISocketService {
  init(args: http.Server): void
  emitMoneyReceivedByUserId(id: string, amount: Amount): void
  emitMoneySentByUserId(id: string, amount: Amount): void
}

export class SocketService implements ISocketService {
  private io: socketIo.Server | null = null

  constructor(
    private logger: Logger,
    private env: Env,
    private accountService: AccountService
  ) {}

  init(server: http.Server) {
    this.io = new socketIo.Server(server, {
      cors: {
        origin: [
          'http://localhost:4003',
          `https://${this.env.RAFIKI_MONEY_FRONTEND_HOST}`
        ],
        credentials: true
      }
    })
    this.logger.info(`Socket Server is started...`)

    this.io.engine.use(withSession)
    this.io.on('connection', async (socket) => {
      const user = socket.request.session.user
      if (!user) {
        this.deps.logger.info(`The socket user is still not logged in...`)
        return
      }

      const userId = user.id
      this.logger.info(`A socket client ${userId} is connected...`)
      socket.join(userId)

      // Handle events
      socket.on('disconnect', () => {
        socket.leave(userId)
        this.logger.info(`A socket client ${userId} disconnected...`)
      })

      socket.on('error', (e) => {
        this.logger.error('Error in socket communication', e)
      })
    })
  }

  async emitMoneyReceivedByUserId(userId: string, amount: Amount) {
    const account = await this.accountService.getAccountByAssetCode(
      userId,
      amount
    )
    this.io?.to(userId).emit(MessageType.MONEY_RECEIVED, account, amount)
  }

  async emitMoneySentByUserId(userId: string, amount: Amount) {
    const account = await this.accountService.getAccountByAssetCode(
      userId,
      amount
    )
    this.io?.to(userId).emit(MessageType.MONEY_SENT, account, amount)
  }
}
