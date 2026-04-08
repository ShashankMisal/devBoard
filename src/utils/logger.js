const fs = require('fs');
const path = require('path');
const winston = require('winston');,

const config = require('../config/config');

const logDirectoryPath = path.resolve(process.cwd(), 'logs');

// Creating the directory up front prevents production logging from silently failing on the first write attempt.
fs.mkdirSync(logDirectoryPath, { recursive: true });

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    const serializedMetadata =
      Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';

    return `${timestamp} [${level}]: ${message}${serializedMetadata}`;
  })
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  winston.format.json()
);

const transports = [];

if (config.app.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectoryPath, 'error.log'),
      level: 'error'
    }),
    new winston.transports.File({
      filename: path.join(logDirectoryPath, 'combined.log')
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: {
    service: 'devboard-api',
    environment: config.app.env
  },
  format: productionFormat,
  transports
});

const buildRequestLogLine = (tokens, req, res, formatName) => {
  const parts = [
    `requestId=${tokens.id(req, res)}`,
    `method=${tokens.method(req, res)}`,
    `url=${tokens.url(req, res)}`,
    `status=${tokens.status(req, res)}`,
    `responseTime=${tokens['response-time'](req, res)}ms`
  ];

  if (formatName === 'combined') {
    parts.push(`contentLength=${tokens.res(req, res, 'content-length') || 0}`);
    parts.push(`userAgent="${tokens['user-agent'](req, res) || '-'}"`);
  }

  return parts.join(' ');
};

const morganStream = {
  // Routing Morgan through Winston keeps request logs in the same observability pipeline as application logs.
  write: (message) => {
    logger.http(message.trim());
  }
};

module.exports = {
  logger,
  morganStream,
  buildRequestLogLine
};
