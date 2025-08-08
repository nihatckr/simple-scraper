import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  data?: any
  source?: string | undefined
}

class Logger {
  private logLevel: LogLevel
  private logDir: string

  constructor() {
    this.logLevel =
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    this.logDir = join(process.cwd(), 'logs')

    // Logs klasörünü oluştur
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private writeLog(entry: LogEntry) {
    const logFile = join(
      this.logDir,
      `app-${new Date().toISOString().split('T')[0]}.log`,
    )
    const logLine = `${entry.timestamp.toISOString()} [${
      LogLevel[entry.level]
    }] ${entry.source ? `[${entry.source}] ` : ''}${entry.message}${
      entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : ''
    }\n`

    try {
      writeFileSync(logFile, logLine, { flag: 'a' })
    } catch (error) {
      console.error('Log yazma hatası:', error)
    }
  }

  private log(level: LogLevel, message: string, data?: any, source?: string) {
    if (level < this.logLevel) return

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      source,
    }

    // Console'a yazdır
    const emoji =
      level === LogLevel.ERROR
        ? '❌'
        : level === LogLevel.WARN
        ? '⚠️'
        : level === LogLevel.INFO
        ? '✅'
        : '🔍'
    const prefix = source ? `[${source}] ` : ''
    console.log(`${emoji} ${prefix}${message}`, data ? data : '')

    // Dosyaya kaydet
    this.writeLog(entry)
  }

  debug(message: string, data?: any, source?: string) {
    this.log(LogLevel.DEBUG, message, data, source)
  }

  info(message: string, data?: any, source?: string) {
    this.log(LogLevel.INFO, message, data, source)
  }

  warn(message: string, data?: any, source?: string) {
    this.log(LogLevel.WARN, message, data, source)
  }

  error(message: string, data?: any, source?: string) {
    this.log(LogLevel.ERROR, message, data, source)
  }
}

export const logger = new Logger()
