const { createClient } = require('redis');

const config = require('./config');
const { logger } = require('../utils/logger');

const redisClient = createClient({
  url: config.redis.url,
  socket: {
    connectTimeout: 1000,
    reconnectStrategy: (retries) => {
      if (retries === 0) {
        return 100;
      }

      return false;
    }
  }
});

let hasRegisteredRedisListeners = false;
let hasAttemptedRedisConnection = false;

const registerRedisEventListeners = () => {
  if (hasRegisteredRedisListeners) {
    return;
  }

  hasRegisteredRedisListeners = true;

  redisClient.on('connect', () => {
    logger.info('Redis client connected successfully.');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client is reconnecting.');
  });

  redisClient.on('error', (error) => {
    // Redis is treated as an optimization layer, so connection failures are logged and bypassed.
    logger.error('Redis client encountered an error.', {
      errorMessage: error.message,
      stack: error.stack
    });
  });
};

const connectRedis = async () => {
  registerRedisEventListeners();

  if (redisClient.isOpen || hasAttemptedRedisConnection) {
    return redisClient;
  }

  hasAttemptedRedisConnection = true;

  try {
    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection could not be established. Continuing without cache.', {
      errorMessage: error.message
    });
  }

  return redisClient;
};

const closeRedisConnection = async (signal = 'APP_SHUTDOWN') => {
  if (!redisClient.isOpen) {
    return;
  }

  await redisClient.quit();
  logger.info(`Redis connection closed gracefully after receiving ${signal}.`);
};

module.exports = {
  redisClient,
  connectRedis,
  closeRedisConnection
};
