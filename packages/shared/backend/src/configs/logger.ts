import { createLogger, format, LoggerOptions, transports } from 'winston'
import { env } from './env'
import { LoggingWinston } from '@google-cloud/logging-winston'

const loggerTransports: LoggerOptions['transports'] = [
  new transports.Console({
    level: env.NODE_ENV === 'development' ? 'debug' : 'info'
  })
]

if (env.NODE_ENV === 'production') {
  const loggingWinston = new LoggingWinston()
  loggerTransports.push(loggingWinston)
}

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
  transports: loggerTransports
})
