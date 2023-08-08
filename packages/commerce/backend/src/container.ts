import {
  AwilixContainer,
  InjectionMode,
  asValue,
  createContainer as createAwilixContainer
} from 'awilix'
import type { Env } from './config/env'

export interface Cradle {
  env: Env
}

export function createContainer(env: Env): AwilixContainer<Cradle> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })

  container.register({
    env: asValue(env)
  })

  return container
}
