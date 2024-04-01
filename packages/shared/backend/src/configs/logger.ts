import { createLogger, format, LoggerOptions, transports } from 'winston'
import { LoggingWinston } from '@google-cloud/logging-winston'

export const initLogger = (nodeEnv: string) => {
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
      format.printf(
        (info) =>
          `[${info.timestamp}] [${info.level}] ${info.message}` +
          (info.stack ? `\n${info.stack}` : '')
      )
    ),
    transports: loggerTransports
  })
}
