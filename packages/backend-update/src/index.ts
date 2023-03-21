import knex from 'knex'
import { App, Bindings } from './app'
import { AuthController } from './auth/controller'
import { AuthRouter } from './auth/router'
import { AuthService } from './auth/service'
import { Env, env } from './config/env'
import { logger } from './config/logger'
import { Container } from './container'
import { UserService } from './user/service'

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

  // User Modules
  container.register('userService', async () => new UserService())

  // Authenication Modules
  container.register('authService', async () => {
    const userService = await container.resolve('userService')
    return new AuthService(userService)
  })
  container.register('authController', async () => {
    const env = await container.resolve('env')
    const logger = await container.resolve('logger')
    const authService = await container.resolve('authService')

    return new AuthController(authService, env, logger)
  })
  container.register('authRouter', async () => {
    const authController = await container.resolve('authController')
    return new AuthRouter(authController)
  })

  return container
}

const container = createContainer(env)
const app = new App(container)

export const start = async (app: App): Promise<void> => {
  await app.startServer()
  console.info(`Server listening on port ${app.getPort()}`)
}

if (!module.parent) {
  start(app).catch(async (e): Promise<void> => {
    console.log(e)
  })
}
