import {
  format,
  createLogger,
  transports
} from 'winston';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ message, level, timestamp }) => {
    return `${timestamp} [${level.toUpperCase().padEnd(7)}]: ${message}`;
  }),
  format.colorize({ all: true })
);

const logger = createLogger({
  format:
    logFormat,
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs', level: 'silly' })
  ]
});

export default logger;
