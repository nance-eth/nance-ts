import {
  format,
  createLogger,
  transports
} from 'winston';
import 'dotenv/config';

const logFormat = format.combine(
  format.colorize({ message: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.printf(({ message, level }) => {
    let messageText;
    if (typeof message === 'object') {
      messageText = JSON.stringify(message, null, 3);
    } else { messageText = message; }
    return `[${level.toUpperCase().padEnd(5)}]: ${messageText}`;
  })
);

const logger = createLogger({
  format:
    logFormat,
  level: process.env.LOG_LEVEL,
  transports: [
    new transports.Console(),
  ]
});

export default logger;
