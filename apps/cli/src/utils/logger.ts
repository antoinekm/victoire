import { createLogger, format, transports } from 'winston';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  }),
);

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({ all: true }),
        logFormat
      ),
    }),
    new transports.File({ filename: 'pierre-cli-error.log', level: 'error' }),
    new transports.File({ filename: 'pierre-cli.log' }),
  ],
});