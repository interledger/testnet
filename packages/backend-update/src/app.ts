import express, { Express } from 'express'
import { Server } from 'http'
import type { Env } from './config/env'
import type { Logger } from 'winston'
import { Container } from './container'

export interface Bindings {
  env: Env
  logger: Logger
}

export class App {
  private server!: Server

  constructor(private container: Container<Bindings>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = await this.container.resolve('env')
    this.server = express.listen(env.PORT)
  }

  public getPort(): number {
    const address = this.server.address()
    if (address && !(typeof address === 'string')) {
      return address.port
    }
    return 0
  }

  private async init(): Promise<Express> {
    const app = express()

    app.get('/', async (_req, res) => {
      res.status(200).json({ Hello: 'World' })
    })

    return app
  }
}
