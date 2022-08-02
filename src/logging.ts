import {
  format,
  createLogger,
  transports
} from 'winston';
import 'dotenv/config';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';

if (process.env.NODE_ENV !== 'dev') console.log = function none() {};

const logtail = new Logtail(process.env.LOGTAIL_KEY ?? '');
const LOGTAIL_SILENT = process.env.NODE_ENV === 'dev';

const logFormat = format.combine(
  format.colorize({ message: true }),
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.printf(({ message, level, timestamp }) => {
    let messageText;
    if (typeof message === 'object') {
      messageText = JSON.stringify(message, null, 3);
    } else { messageText = message; }
    return `${timestamp} [${level.toUpperCase().padEnd(7)}]: ${messageText}`;
  })
);

const logger = createLogger({
  format:
    logFormat,
  level: 'silly',
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs.log' }),
    new LogtailTransport(logtail, { silent: LOGTAIL_SILENT, format: format.json() })
  ]
});

export default logger;
