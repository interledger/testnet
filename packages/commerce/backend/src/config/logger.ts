import {
  createLogger as createWinstonLogger,
  format,
  transports
} from 'winston'
import { type Env } from './env'

export function createLogger(env: Env) {
  const logger = createWinstonLogger({
    silent: env.NODE_ENV === 'test',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.printf(
        (info) =>
          `[${info.timestamp}] [${info.level}] ${info.message}` +
          (info.stack ? `\n${info.stack}` : '')
      )
    ),
    transports: [
      new transports.Console({
        level: env.NODE_ENV === 'development' ? 'debug' : 'info'
      })
    ]
  })

  return logger
}
