import type { Env } from '@/config/env'
import { Logger } from 'winston'
import socketIo from 'socket.io'
import http from 'http'
import { decrypt } from '@/utils/crypto'

interface ISocketService {
  init(args: http.Server): void
  emitBalanceUpdateByEmail(email: string): void
}

interface SocketServiceDependencies {
  logger: Logger
  env: Env
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

    this.io.on('connection', (socket) => {
      const emailToken = socket.handshake.query.emailToken!.toString()
      const email = emailToken ? decrypt(emailToken) : ''
      socket.join(email)

      this.deps.logger.info(`A socket client ${email} is connected...`)

      // Handle events
      socket.on('disconnect', () => {
        // this.sockets.delete(email)
        this.deps.logger.info(`socket client disconnected...`)
      })
    })
  }

  emitBalanceUpdateByEmail(email: string) {
    this.io?.to(email).emit('message', 'please update balance!')
  }
}
