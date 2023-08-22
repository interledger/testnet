import type { Env } from '@/config/env'
import { Logger } from 'winston'
import socketIo from 'socket.io'
import http from 'http'

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
  private sockets = new Map()

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
      const email = socket.handshake.query.email // Access the user's email
      this.sockets.set(email, socket)
      this.deps.logger.info(`A socket client ${email} is connected...`)

      // Handle events
      socket.on('disconnect', () => {
        this.sockets.delete(email)
        this.deps.logger.info(`socket client disconnected...`)
      })
    })
  }

  emitBalanceUpdateByEmail(email: string) {
    if (this.io) {
      const socket = this.sockets.get(email)
      if (socket) {
        socket.emit('message', 'please update balance')
      } else {
        // Handle the case where the user is not connected
        console.log(`User with email ${email} is not connected.`)
      }
    }
  }
}
