import path from 'node:path'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

export type LogCategory =
  | 'app'
  | 'auth'
  | 'db'
  | 'http'
  | 'bootstrap'
  | 'queue'
  | 'scheduler'

const logDir = path.join(process.cwd(), 'logs')
const level = process.env.LOG_LEVEL ?? 'info'

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, category, ...meta }) => {
    const tag = category ? `[${String(category)}] ` : ''
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} ${level} ${tag}${String(message)}${rest}`
  })
)

const allRotateFile = new DailyRotateFile({
  filename: path.join(logDir, '%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  format: fileFormat
})

const errorRotateFile = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '7d',
  level: 'error',
  format: fileFormat
})

const base = winston.createLogger({
  level,
  defaultMeta: { service: 'energy2iot-server' },
  transports: [allRotateFile, errorRotateFile, new winston.transports.Console({ format: consoleFormat })]
})

allRotateFile.on('rotate', (oldFile, newFile) => {
  base.debug('log rotated', { oldFile, newFile })
})

const build = (category: LogCategory) => base.child({ category })

export const logger = {
  app: build('app'),
  auth: build('auth'),
  db: build('db'),
  http: build('http'),
  bootstrap: build('bootstrap'),
  queue: build('queue'),
  scheduler: build('scheduler')
}

export type Logger = (typeof logger)[LogCategory]