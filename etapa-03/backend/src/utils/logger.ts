import { isDevelopment } from './config.js';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  error(message: string, meta?: any): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, meta));
    }
  }

  warn(message: string, meta?: any): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    if (this.level >= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, meta));
    }
  }

  debug(message: string, meta?: any): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger();