import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'
import { existsSync, mkdirSync } from 'fs'

const env = process.env.NODE_ENV || 'development'
const logDirectory = path.join(__dirname, '../../logs')

// Create the log directory if it does not exist
if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory)
}

const dailyRotateTransport = new DailyRotateFile({
  level: 'debug',
  dirname: logDirectory,
  filename: '%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
})

const logger = (name: string) =>
  createLogger({
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.printf(
        (info) =>
          `[${info.timestamp}] [${info.level}] [${name}] ${info.message}` +
          (info.stack ? `\n${info.stack}` : '')
      )
    ),
    transports: [
      new transports.Console({
        level: env === 'development' ? 'debug' : 'info'
      }),
      dailyRotateTransport
    ]
  })

export default logger
