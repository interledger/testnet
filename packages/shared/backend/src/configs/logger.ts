import { createLogger, format, LoggerOptions, transports } from 'winston'
import { LoggingWinston } from '@google-cloud/logging-winston'

let storedNodeEnv = 'development'
export const initLogger = (nodeEnv?: string) => {
  nodeEnv ? (storedNodeEnv = nodeEnv) : (nodeEnv = storedNodeEnv)
  const loggerTransports: LoggerOptions['transports'] = [
    new transports.Console({
      level: nodeEnv === 'development' ? 'debug' : 'info'
    })
  ]

  if (nodeEnv === 'production') {
    const loggingWinston = new LoggingWinston()
    loggerTransports.push(loggingWinston)
  }

  return createLogger({
    silent: nodeEnv === 'test',
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label']
      }),
      format.printf((info) => {
        let message =
          `[${info.timestamp}] [${info.level}] ${info.message}` +
          (info.stack ? `\n${info.stack}` : '')

        if (
          info.metadata &&
          typeof info.metadata === 'object' &&
          Object.keys(info.metadata).length
        ) {
          message = message + `\n context: ${JSON.stringify(info.metadata)}`
        }

        return message
      })
    ),
    transports: loggerTransports
  })
}
