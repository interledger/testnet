import type { Env } from '@/config/env'
import { Logger } from 'winston'
import socketIo from 'socket.io'
import http from 'http'

interface ISocketService {
  init(args: http.Server): void
  emitBalanceUpdate(balance: number): void
}

interface SocketServiceDependencies {
  logger: Logger
  env: Env
}

export class SocketService implements ISocketService {
  private io: socketIo.Server | null = null

  constructor(private deps: SocketServiceDependencies) {}

  init(server: http.Server) {
    this.io = new socketIo.Server(server)
    this.deps.logger.info(`Socket Server is started...`)

    this.io.on('connection', (socket) => {
      this.deps.logger.info(`A socket client is connected...`)

      // Handle events
      socket.on('disconnect', () => {
        console.log('Client disconnected')
      })
    })
  }

  emitBalanceUpdate(balance: number) {
    if (this.io) {
      this.io.emit('balanceUpdate', balance)
    }
  }
}
