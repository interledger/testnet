import { createLogger, format, transports } from 'winston'
import { env } from './env'

export const logger = createLogger({
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
