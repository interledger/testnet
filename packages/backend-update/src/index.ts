import knex from 'knex'
import { App, Bindings } from './app'
import { AuthController } from './auth/controller'
import { AuthService } from './auth/service'
import { Env, env } from './config/env'
import { logger } from './config/logger'
import { Container } from './container'
import { UserService } from './user/service'
import { UserController } from './user/controller'
import { SessionService } from './session/service'

export const createContainer = (config: Env): Container<Bindings> => {
  const container = new Container<Bindings>()
  container.register('env', async () => config)
  container.register('logger', async () => logger)
  container.register('knex', async () => {
    const env = await container.resolve('env')
    const _knex = knex({
      client: 'postgresql',
      connection: env.DATABASE_URL,
      migrations: {
        directory: './',
        tableName: 'knex_migrations'
      }
    })

    _knex.client.driver.types.setTypeParser(
      _knex.client.driver.types.builtins.INT8,
      'text',
      BigInt
    )
    return _knex
  })

  // Session Modules
  container.register('sessionService', async () => new SessionService())

  // User Modules
  container.register('userService', async () => new UserService())
  container.register('userController', async () => {
    const logger = await container.resolve('logger')
    const userService = await container.resolve('userService')
    const sessionService = await container.resolve('sessionService')
    return new UserController(userService, sessionService, logger)
  })

  // Authenication Modules
  container.register('authService', async () => {
    const env = await container.resolve('env')
    const userService = await container.resolve('userService')
    return new AuthService(userService, env)
  })

  container.register('authController', async () => {
    const logger = await container.resolve('logger')
    const authService = await container.resolve('authService')
    const userService = await container.resolve('userService')
    return new AuthController(authService, userService, logger)
  })

  return container
}

const container = createContainer(env)
const app = new App(container)

export const start = async (app: App): Promise<void> => {
  await app.startServer()
}

if (!module.parent) {
  start(app).catch(async (e): Promise<void> => {
    console.log(e)
  })
}
