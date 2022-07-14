import {
  format,
  createLogger,
  transports
} from 'winston';

if (process.env.NODE_ENV !== 'dev') console.log = function none() {};

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ message, level, timestamp }) => {
    let messageText;
    if (typeof message === 'object') {
      messageText = JSON.stringify(message, null, 3);
    } else { messageText = message; }
    return `${timestamp} [${level.toUpperCase().padEnd(7)}]: ${messageText}`;
  }),
  format.colorize({ all: true })
);

const logger = createLogger({
  format:
    logFormat,
  transports: [
    new transports.Console({ level: 'silly' }),
    new transports.File({ filename: 'logs.log', level: 'silly' })
  ]
});

export default logger;
