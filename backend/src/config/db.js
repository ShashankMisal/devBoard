const mongoose = require('mongoose');

const config = require('./config');
const { logger } = require('../utils/logger');

let areConnectionListenersAttached = false;

const registerConnectionListeners = () => {
  if (areConnectionListenersAttached) {
    return;
  }

  areConnectionListenersAttached = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error occurred.', {
      errorMessage: error.message,
      stack: error.stack
    });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB connection was disconnected.');
  });
};

const connectDB = async () => {
  registerConnectionListeners();

  await mongoose.connect(config.database.uri);
};

const closeDatabaseConnection = async (signal = 'APP_SHUTDOWN') => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  // Closing active connections gracefully protects in-flight operations from being terminated mid-write.
  await mongoose.connection.close();
  logger.info(`MongoDB connection closed gracefully after receiving ${signal}.`);
};

module.exports = {
  connectDB,
  closeDatabaseConnection
};
