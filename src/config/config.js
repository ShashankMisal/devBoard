const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const runtimeEnvironment = process.env.NODE_ENV || 'development';
const envFilePath = path.resolve(process.cwd(), `.env.${runtimeEnvironment}`);

if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
} else {
  dotenv.config();
}

const requiredEnvironmentVariables = [
  'PORT',
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRY',
  'JWT_REFRESH_EXPIRY',
  'REDIS_URL',
  'ALLOWED_ORIGINS',
  'LOG_LEVEL'
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((variableName) => {
  return !process.env[variableName] || !String(process.env[variableName]).trim();
});

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironmentVariables.join(', ')}`
  );
}

const freezeDeep = (value) => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.getOwnPropertyNames(value).forEach((propertyName) => {
      freezeDeep(value[propertyName]);
    });

    Object.freeze(value);
  }

  return value;
};

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const parsedPort = Number(process.env.PORT);

if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
  throw new Error('PORT must be a positive integer.');
}

if (allowedOrigins.length === 0) {
  throw new Error('ALLOWED_ORIGINS must contain at least one origin.');
}

const config = {
  app: {
    name: 'DevBoard API',
    env: process.env.NODE_ENV,
    port: parsedPort
  },
  database: {
    uri: process.env.MONGODB_URI
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY,
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY
  },
  redis: {
    url: process.env.REDIS_URL
  },
  cors: {
    allowedOrigins
  },
  logging: {
    level: process.env.LOG_LEVEL
  }
};

module.exports = freezeDeep(config);
