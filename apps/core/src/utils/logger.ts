import winston from 'winston';

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    }`;
  }),
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
      ),
    }),
    new winston.transports.File({ filename: 'pierre-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'pierre.log' }),
  ],
});

// Export utility functions for index modules
export default {
  logger,
};