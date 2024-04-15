import { Logger } from 'winston'
import { asClass, BuildResolver, Constructor } from 'awilix'

export function asClassSingletonWithLogger<T>(
  service: Constructor<T>,
  logger: Logger
): BuildResolver<T> {
  return asClass(service)
    .singleton()
    .inject(() => ({
      logger: logger.child({ service: service.name })
    }))
}
