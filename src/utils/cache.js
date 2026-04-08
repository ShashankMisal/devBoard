const { redisClient } = require('../config/redis');
const { logger } = require('./logger');

const isRedisReady = () => {
  return redisClient.isOpen && redisClient.isReady;
};

const getCache = async (key) => {
  if (!isRedisReady()) {
    return null;
  }

  try {
    const rawValue = await redisClient.get(key);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    logger.warn('Failed to read from Redis cache. Falling back to MongoDB.', {
      cacheKey: key,
      errorMessage: error.message
    });

    return null;
  }
};

const setCache = async (key, data, ttlSeconds) => {
  if (!isRedisReady()) {
    return false;
  }

  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttlSeconds
    });

    return true;
  } catch (error) {
    logger.warn('Failed to write to Redis cache. Request will continue normally.', {
      cacheKey: key,
      errorMessage: error.message
    });

    return false;
  }
};

const deleteCache = async (key) => {
  if (!isRedisReady()) {
    return 0;
  }

  try {
    return redisClient.del(key);
  } catch (error) {
    logger.warn('Failed to delete Redis cache key.', {
      cacheKey: key,
      errorMessage: error.message
    });

    return 0;
  }
};

const deleteCacheByPattern = async (pattern) => {
  if (!isRedisReady()) {
    return 0;
  }

  let deletedCount = 0;

  try {
    for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
      deletedCount += await redisClient.del(key);
    }
  } catch (error) {
    logger.warn('Failed to delete Redis cache keys by pattern.', {
      cachePattern: pattern,
      errorMessage: error.message
    });
  }

  return deletedCount;
};

module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCacheByPattern
};
